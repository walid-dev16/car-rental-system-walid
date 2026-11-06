const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { PGlite } = require('@electric-sql/pglite');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('node:fs/promises');
const path = require('node:path');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'Integration-only-fixture-key-1234567890';

let database;
let server;
let base;
let users;
const token = (user, extra = {}) => jwt.sign(
  { id: String(user.id), role: user.role, ...extra }, process.env.JWT_SECRET,
  { algorithm: 'HS256', expiresIn: '1h' },
);

// PGlite runs PostgreSQL in process: SQL, constraints, transactions and dates
// are real. These sequential tests do not claim multi-connection lock coverage.
async function query(sql, values) {
  const result = values?.length
    ? await database.query(sql, values)
    : (await database.exec(sql)).at(-1);
  return { ...result, rows: result?.rows || [], rowCount: result?.rows?.length || result?.affectedRows || 0 };
}
const pool = { query, connect: async () => ({ query, release() {} }), on() {}, end: async () => {} };
const dbPath = require.resolve('../db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: pool };

async function request(method, path, body, bearer, headers = {}) {
  const response = await fetch(base + path, {
    method,
    headers: { ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...(bearer ? { authorization: `Bearer ${bearer}` } : {}), ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  return { response, status: response.status, data: response.headers.get('content-type')?.includes('application/json') ? JSON.parse(text) : text };
}

function booking(carId, extra = {}) {
  const pickup = new Date(Date.now() + 7 * 86400000);
  const end = new Date(pickup.getTime() + 2 * 86400000);
  return { car_id: carId, pickup_datetime: pickup.toISOString(), return_datetime: end.toISOString(), payment_method: 'cash', ...extra };
}

before(async () => {
  database = await PGlite.create();
  const migrate = require('../scripts/migrate');
  await migrate();
  const passwordHash = await bcrypt.hash('Fixture-Password-17!', 4);
  users = {};
  for (const role of ['customer', 'other', 'staff', 'admin']) {
    const result = await query(`INSERT INTO users (first_name,last_name,email,password_hash,role,account_status)
      VALUES ($1,'Fixture',$2,$3,$4,'active') RETURNING id,role`, [role, `${role}@example.test`, passwordHash, role === 'other' ? 'customer' : role]);
    users[role] = result.rows[0];
  }
  await migrate();
  assert.equal((await query('SELECT COUNT(*)::int AS count FROM users')).rows[0].count, 4, 'migration rerun must retain users');
  assert.equal((await query('SELECT COUNT(*)::int AS count FROM cars')).rows[0].count, 8, 'demo seed must not duplicate cars');
  server = require('../app').listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
  await database?.close();
});

test('public fleet, isolated JSON API, security headers and private paths', async () => {
  const cars = await request('GET', '/api/cars');
  assert.equal(cars.status, 200);
  assert.equal(cars.data.length, 8);
  assert.equal(cars.response.headers.get('x-content-type-options'), 'nosniff');
  assert.match(cars.response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.equal((await request('GET', '/api/not-a-route', undefined, undefined, { accept: 'text/html' })).status, 404);
  assert.equal((await request('GET', '/.env')).status, 404);
  assert.equal((await request('GET', '/backend/schema.sql')).status, 404);
  assert.equal((await request('GET', '/api/users')).status, 401);
  assert.equal((await request('GET', '/api/users', undefined, token(users.customer))).status, 403);
});

test('migrations retain a legacy database and add missing fleet columns without seeding over it', async () => {
  const legacy = await PGlite.create();
  try {
    // The original reset DDL is executed only on this fresh disposable database.
    await legacy.exec(await fs.readFile(path.join(__dirname, '../schema.sql'), 'utf8'));
    await legacy.query("INSERT INTO users(first_name,last_name,email,password_hash) VALUES ('Keep','Me','retain@example.test','fixture')");
    await legacy.query("INSERT INTO cars(brand,model,production_year,category,plate_number,seats,transmission,fuel_type,daily_price) VALUES ('Keep','Car',2024,'sedan','KEEP-1',5,'manual','petrol',55)");
    await legacy.exec(await fs.readFile(path.join(__dirname, '../migrations/001_initial_schema.sql'), 'utf8'));
    await legacy.exec(await fs.readFile(path.join(__dirname, '../migrations/002_demo_fleet.sql'), 'utf8'));
    assert.equal((await legacy.query('SELECT email FROM users')).rows[0].email, 'retain@example.test');
    assert.equal((await legacy.query('SELECT COUNT(*)::int AS count FROM cars')).rows[0].count, 1);
    await legacy.query("UPDATE cars SET description='Retained', available_branches='Berlin', doors=4 WHERE plate_number='KEEP-1'");
    assert.equal((await legacy.query("SELECT description FROM cars WHERE plate_number='KEEP-1'")).rows[0].description, 'Retained');
  } finally {
    await legacy.close();
  }
});

test('registration validates secrets and cannot select admin authority', async () => {
  const weak = await request('POST', '/api/auth/register', { first_name: 'Demo', last_name: 'Visitor', email: 'weak@example.test', password: 'x', role: 'admin' });
  assert.equal(weak.status, 400);
  const created = await request('POST', '/api/auth/register', { first_name: 'Demo', last_name: 'Visitor', email: 'demo@example.test', password: 'Strong-demo-secret-17!', role: 'admin' });
  assert.equal(created.status, 201);
  assert.equal(created.data.user.role, 'customer');
  assert.equal(created.data.user.password_hash, undefined);
  const login = await request('POST', '/api/auth/login', { email: 'DEMO@example.test', password: 'Strong-demo-secret-17!' });
  assert.equal(login.status, 200);
  assert.equal(jwt.verify(login.data.token, process.env.JWT_SECRET).role, 'customer');
});

test('booking owner is identity-bound and quote is computed from database price', async () => {
  const spoof = await request('POST', '/api/bookings', booking(1, { user_id: users.other.id, total_price: -1 }), token(users.customer));
  assert.equal(spoof.status, 403);
  const created = await request('POST', '/api/bookings', booking(1, { user_id: users.customer.id, total_price: -1 }), token(users.customer));
  assert.equal(created.status, 201);
  assert.equal(String(created.data.user_id), String(users.customer.id));
  assert.equal(Number(created.data.total_price), 90);
  assert.ok(created.data.expires_at);
  assert.equal((await request('POST', '/api/bookings', booking(1), token(users.other))).status, 409);
  const mine = await request('GET', '/api/bookings/my', undefined, token(users.other));
  assert.equal(mine.data.length, 0);
});

test('long holds, maintenance cars and excessive customer requests are bounded', async () => {
  const long = booking(2);
  long.return_datetime = new Date(Date.parse(long.pickup_datetime) + 100 * 86400000).toISOString();
  assert.equal((await request('POST', '/api/bookings', long, token(users.customer))).status, 400);
  assert.equal((await request('POST', '/api/bookings', booking(3), token(users.customer))).status, 409);
  assert.equal((await request('POST', '/api/bookings', booking(2), token(users.customer))).status, 201);
  assert.equal((await request('POST', '/api/bookings', booking(4), token(users.customer))).status, 201);
  assert.equal((await request('POST', '/api/bookings', booking(5), token(users.customer))).status, 409);
});

test('expired holds release inventory and cannot be confirmed over another booking', async () => {
  await query("UPDATE bookings SET expires_at=NOW()-INTERVAL '1 minute' WHERE car_id=1");
  const expired = (await query('SELECT id FROM bookings WHERE car_id=1')).rows[0];
  const replacement = await request('POST', '/api/bookings', booking(1), token(users.other));
  assert.equal(replacement.status, 201);
  assert.equal((await request('PATCH', `/api/bookings/${expired.id}/complete`, {}, token(users.staff))).status, 409);
  const confirmed = await request('PATCH', `/api/bookings/${replacement.data.id}/complete`, {}, token(users.staff));
  assert.equal(confirmed.status, 200);
  assert.equal(Number(confirmed.data.booking.total_price), 90);
});

test('live roles and account deletion immediately affect existing bearer tokens', async () => {
  const stale = token(users.staff);
  await query("UPDATE users SET role='customer' WHERE id=$1", [users.staff.id]);
  assert.equal((await request('GET', '/api/bookings', undefined, stale)).status, 403);
  await query("UPDATE users SET role='staff' WHERE id=$1", [users.staff.id]);
  assert.equal((await request('GET', '/api/bookings', undefined, stale)).status, 200);
  const deleted = await request('DELETE', `/api/users/${users.staff.id}`, undefined, token(users.admin));
  assert.equal(deleted.status, 200);
  assert.equal(deleted.data.user.password_hash, undefined);
  assert.equal((await request('GET', '/api/bookings', undefined, stale)).status, 401);
});
