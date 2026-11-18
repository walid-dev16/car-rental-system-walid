const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { fleetStatus, overlapsPeriod } = require('../booking-availability');

// A private single-user PostgreSQL backend reads SQL on stdin. It never opens a network or socket listener.
test('fleet status respects operational blocks, half-open rental periods and expiring holds on upgraded data', t => {
  const bindir = spawnSync('pg_config', ['--bindir'], { encoding: 'utf8' }).stdout?.trim();
  if (!bindir || !fs.existsSync(path.join(bindir, 'initdb')) || process.getuid?.() === 0) {
    return t.skip('Needs local PostgreSQL server binaries and an unprivileged OS user');
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rental-fleet-test-'));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const data = path.join(tmp, 'data');
  const opts = { encoding: 'utf8', timeout: 15000, stdio: ['ignore', 'pipe', 'pipe'], env: { PATH: process.env.PATH, LC_ALL: 'C', TZ: 'UTC' } };
  const init = spawnSync(path.join(bindir, 'initdb'), ['--no-sync', '-D', data], opts);
  assert.equal(init.status, 0, init.stderr);

  const migration = fs.readFileSync(path.join(__dirname, '../migrations/002_period_availability.sql'), 'utf8').replace(/--[^\n]*/g, '');
  const start = "(current_date + interval '5 days 12 hours')";
  const end = "(current_date + interval '5 days 13 hours')";
  const now = "(statement_timestamp() AT TIME ZONE 'Europe/Berlin')";
  const dateStatus = fleetStatus(overlapsPeriod(start, end));
  const statements = [
    'CREATE TABLE cars (id integer PRIMARY KEY, status text NOT NULL, updated_at timestamp);',
    'CREATE TABLE bookings (car_id integer, status text, pickup_datetime timestamp, return_datetime timestamp, created_at timestamp, updated_at timestamp);',
    `INSERT INTO cars VALUES (1,'booked','2025-01-01'), (2,'booked','2025-01-01'), (3,'booked','2025-01-01'),
      (4,'maintenance','2025-01-01'), (5,'available','2025-01-01'), (6,'available','2025-01-01'),
      (7,'available','2025-01-01'), (8,'available','2025-01-01'), (9,'booked','2025-01-02');`,
    `INSERT INTO bookings VALUES
      (1,'booked',${start},${end},now(),'2025-01-01'),
      (2,'booked',${now} - interval '3 days',${now} - interval '2 days',now(),'2025-01-01'),
      (4,'booked',${start},${end},now(),'2025-01-01'),
      (5,'pending',${start},${end},now(),'2025-01-01'),
      (6,'pending',${start},${end},NULL,'2025-01-01'),
      (7,'booked',${now} - interval '1 hour',${now} + interval '1 hour',now(),'2025-01-01'),
      (8,'booked',${end},${end} + interval '2 hours',now(),'2025-01-01'),
      (9,'booked',${start},${end},now(),'2025-01-01');`,
    migration, migration,
    `CREATE TEMP TABLE expected (id integer, current_status text, date_status text, inferred boolean);`,
    `INSERT INTO expected VALUES (1,'available','booked',true), (2,'available','available',true),
      (3,'booked','booked',false), (4,'maintenance','maintenance',false), (5,'available','booked',false),
      (6,'available','available',false), (7,'booked','available',false), (8,'available','available',false),
      (9,'booked','booked',false);`,
    `DO $$ BEGIN IF EXISTS (SELECT 1 FROM cars c JOIN expected e USING (id)
       WHERE e.inferred IS DISTINCT FROM c.status_from_booking OR e.current_status <> (${fleetStatus()}) OR e.date_status <> (${dateStatus}))
       THEN RAISE EXCEPTION 'Fleet status or migration provenance mismatch'; END IF; END $$;`,
    `DO $$ BEGIN IF EXISTS (SELECT 1 FROM bookings WHERE pickup_branch IS NOT NULL OR dropoff_branch IS NOT NULL)
       OR (SELECT count(*) FROM cars) <> 9 OR (SELECT count(*) FROM bookings) <> 8
       THEN RAISE EXCEPTION 'Migration changed legacy records'; END IF; END $$;`,
  ];
  const input = statements.map(sql => sql.replace(/\s+/g, ' ').trim()).join('\n') + '\n';
  const fixtureFile = path.join(tmp, 'availability.sql');
  fs.writeFileSync(fixtureFile, input);
  const fd = fs.openSync(fixtureFile, 'r');
  t.after(() => fs.closeSync(fd));
  const result = spawnSync(path.join(bindir, 'postgres'), ['--single', '-D', data, 'postgres'], { ...opts, stdio: [fd, 'pipe', 'pipe'] });
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stderr, /\b(ERROR|FATAL|PANIC):/);
});
