const assert = require('node:assert/strict');
const { test } = require('node:test');

// Inject only the database and authentication boundary. No application credentials or network are used.
const dbPath = require.resolve('../db');
const authPath = require.resolve('../middleware/auth.middleware');
const database = {};
const fixtureSettings = {
  BOOKING_HOLD_HOURS: '24',
  BOOKING_MAX_PENDING_PER_CUSTOMER: '3',
  BOOKING_MAX_RENTAL_DAYS: '30',
};
const previousSettings = {};
for (const [key, value] of Object.entries(fixtureSettings)) {
  previousSettings[key] = process.env[key];
  process.env[key] = value;
}
require.cache[dbPath] = { exports: database };
require.cache[authPath] = { exports: (_req, _res, next) => next() };
const router = require('../routes/bookings.routes');
delete require.cache[dbPath];
delete require.cache[authPath];
for (const [key, value] of Object.entries(previousSettings)) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

const body = { car_id: '4', pickup_datetime: '2040-03-10T12:00', return_datetime: '2040-03-11T12:01' };
const period = { pickup: '2040-03-10 12:00', dropoff: '2040-03-11 12:01', days: 2, future: true, representable: true };
const car = { id: '4', status: 'available', daily_price: '19.99', available_branches: 'Berlin, Erfurt' };
const pending = { id: '8', status: 'pending', pickup: period.pickup, dropoff: period.dropoff };

async function run(method, path, req, steps, expectedStatus) {
  const remaining = [...steps];
  let failure;
  let released = false;
  database.connect = async () => ({
    async query(sql, args) {
      if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return {};
      try {
        assert.ok(remaining.length, `Unexpected database query ${sql}`);
        const [pattern, rows, validate] = remaining.shift();
        assert.match(sql, pattern);
        if (validate) validate(args);
        return { rows, rowCount: rows.length };
      } catch (error) { failure = error; throw error; }
    },
    release() { released = true; },
  });
  const response = { status(code) { this.code = code; return this; }, json(result) { this.result = result; } };
  const route = router.stack.find(layer => layer.route.path === path && layer.route.methods[method]).route;
  await route.stack.at(-1).handle(req, response);
  if (failure) throw failure;
  assert.equal(response.code, expectedStatus);
  assert.deepEqual(remaining, []);
  assert.equal(released, true);
  return response.result;
}

const customer = { id: '12', role: 'customer' };
const admin = { id: '1', role: 'admin' };
const ownerLock = [/FROM users .*FOR UPDATE/, [{ id: customer.id }], args => assert.equal(args[0], customer.id)];
const carLock = [/FROM cars c WHERE c.id = \$1 FOR UPDATE/, [car]];
const staffLock = [/FOR UPDATE OF c/, [car]];
const bookingLock = [/FROM bookings b .*FOR UPDATE/, [pending]];
const periodResult = [/WITH instants/, [period]];
const quota = [/SELECT count\(\*\).*b.status = 'pending'/, [{ count: '0' }]];
const available = [/b.id IS DISTINCT FROM/, []];
const inserted = [/INSERT INTO bookings/, [pending], args => {
  assert.equal(args[0], customer.id);
  assert.equal(args[4], '39.98');
}];

test('customer creation uses authenticated owner and a server-calculated total', async () => {
  // Old clients may submit a stale draft account or quote along with the selected dates.
  const draft = { ...body, user_id: '52', total_price: '38.00' };
  const result = await run('post', '/', { user: customer, body: draft }, [ownerLock, carLock, periodResult, quota, available, inserted], 201);
  assert.equal(result.id, pending.id);
});

test('staff can book for a named customer at the fleet rate', async () => {
  await run('post', '/', { user: { id: '7', role: 'staff' }, body: { ...body, user_id: customer.id } },
    [ownerLock, carLock, periodResult, available, inserted], 201);
});

test('a full pending quota and overlong online rental stop before creating a booking', async () => {
  await run('post', '/', { user: customer, body }, [ownerLock, carLock, periodResult, [quota[0], [{ count: '2147483647' }]]], 409);
  await run('post', '/', { user: customer, body }, [ownerLock, carLock, [periodResult[0], [{ ...period, days: 2147483648 }]]], 400);
});

test('admin edits lock the car before checking availability and accept a positive agreed price', async () => {
  await run('put', '/:id', { user: admin, params: { id: pending.id }, body: { ...body, total_price: '92.10' } },
    [staffLock, bookingLock, periodResult, available, [/UPDATE bookings/, [pending], args => assert.equal(args[2], '92.10')]], 200);
});

test('admin edits reject amounts beyond the capacity of NUMERIC(10,2)', async () => {
  await run('put', '/:id', { user: admin, params: { id: pending.id }, body: { ...body, total_price: '100000000.00' } },
    [staffLock, bookingLock, periodResult, available], 400);
});

test('expired requests cannot be edited or confirmed', async () => {
  for (const [method, path] of [['patch', '/:id/complete'], ['put', '/:id']]) {
    await run(method, path, { user: admin, params: { id: pending.id }, body },
      [staffLock, [bookingLock[0], [{ ...pending, status: 'expired' }]]], 409);
  }
});

test('confirmation checks availability while holding the car lock', async () => {
  await run('patch', '/:id/complete', { user: admin, params: { id: pending.id } },
    [staffLock, bookingLock, [available[0], [{ present: 1 }]]], 400);
});

test('a named pickup and drop-off are checked against this car and persisted on the booking', async () => {
  const chosen = { ...body, pickup_branch: 'BERLIN', dropoff_branch: 'Erfurt' };
  await run('post', '/', { user: customer, body: chosen }, [
    ownerLock, carLock, periodResult, quota, available,
    [inserted[0], [pending], args => assert.deepEqual(args.slice(7), ['Berlin', 'Erfurt'])],
  ], 201);
  await run('post', '/', { user: customer, body: { ...chosen, dropoff_branch: 'Hamburg' } }, [ownerLock, carLock], 400);
});

test('a pending inquiry with unknown branches stores two nulls', async () => {
  await run('post', '/', { user: customer, body }, [
    ownerLock, [carLock[0], [{ ...car, available_branches: null }]], periodResult, quota, available,
    [inserted[0], [pending], args => assert.deepEqual(args.slice(7), [null, null])],
  ], 201);
});

test('a staff-imposed fleet block prevents booking even when no reservation uses that period', async () => {
  for (const status of ['booked', 'maintenance']) {
    await run('post', '/', { user: customer, body }, [
      ownerLock, [carLock[0], [{ ...car, status }]], periodResult, quota,
    ], 400);
  }
});
