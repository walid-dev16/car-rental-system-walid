const { test, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');

let db;
let catalogMigration;
const allCars = async () => (await db.query('SELECT * FROM cars ORDER BY id')).rows;

before(async () => {
  db = await PGlite.create();
  const directory = path.join(__dirname, '../migrations');
  for (const name of ['001_initial_schema.sql', '002_demo_fleet.sql', '003_demo_fleet_photos.sql', '004_restore_original_fleet_photos.sql']) {
    await db.exec(await fs.readFile(path.join(directory, name), 'utf8'));
  }
  catalogMigration = await fs.readFile(path.join(directory, '005_local_demo_catalog.sql'), 'utf8');
});
beforeEach(() => db.query('BEGIN'));
afterEach(() => db.query('ROLLBACK'));
after(() => db.close());

test('imports the public catalog in local order, retaining existing cars, historical bookings and customized images', async () => {
  await db.exec(`
    UPDATE cars SET status = 'maintenance', image_url = '/custom/my-x5.webp' WHERE id = 9;
    INSERT INTO users (first_name, last_name, email, password_hash) VALUES ('Demo', 'Fixture', 'fixture@example.test', 'unused');
    INSERT INTO bookings (user_id, car_id, pickup_datetime, return_datetime, total_price)
    SELECT id, 2, '2025-06-10', '2025-06-11', 85.00 FROM users;
  `);
  const originals = await allCars();
  const bookings = (await db.query('SELECT * FROM bookings')).rows;
  await db.exec(catalogMigration);
  const ranked = (await db.query('SELECT * FROM cars WHERE demo_display_order IS NOT NULL ORDER BY demo_display_order')).rows;
  assert.deepEqual(ranked.map(c => [c.demo_display_order, c.brand, c.model, c.daily_price]), [
    [1, 'BMW', 'X5', '310.00'], [2, 'BMW', 'X3 M40', '200.00'], [3, 'BMW', '3ER', '150.00'],
    [4, 'Audi', 'A3', '140.00'], [5, 'Audi', 'A6 E-Tron', '260.00'], [6, 'Mercedes-Benz', 'CLE', '440.00'],
    [7, 'Mercedes', 'E-Class', '290.00'], [8, 'Porsche', '911 Cabrio', '650.00'], [9, 'Bugatti', 'Chiron', '10000.00'],
  ]);
  for (const c of ranked) {
    for (const key of ['description', 'technical_specifications', 'safety_features', 'performance_info', 'available_branches', 'image_url', 'doors']) {
      assert.ok(c[key], c.plate_number + ' missing ' + key);
    }
    assert.match(c.plate_number, /^DEMO-\d+$/);
  }
  const current = await allCars();
  assert.equal(current.length, originals.length + 5);
  for (const original of originals) {
    const saved = current.find(c => c.id === original.id);
    assert.equal(saved.plate_number, original.plate_number);
    assert.equal(saved.status, original.status);
    assert.equal(saved.image_url, original.image_url);
    if (saved.demo_display_order === null) assert.deepEqual(saved, { ...original, demo_display_order: null });
  }
  assert.deepEqual((await db.query('SELECT * FROM bookings')).rows, bookings);
  await db.exec(catalogMigration);
  assert.deepEqual(await allCars(), current);
});

test('honors unrelated vehicles that already use a reserved demo registration', async () => {
  await db.exec(`
    UPDATE cars SET brand = 'Custom', model = 'Existing', image_url = '/custom/photo.webp' WHERE id = 9;
    INSERT INTO cars (plate_number, brand, model, production_year, category, seats, transmission, fuel_type, daily_price)
    VALUES ('DEMO-2001', 'BMW', 'X3 M40', 2018, 'suv', 4, 'automatic', 'diesel', 60);
  `);
  const before = (await allCars()).filter(c => ['DEMO-1009', 'DEMO-2001'].includes(c.plate_number));
  await db.exec(catalogMigration);
  const current = await allCars();
  for (const car of before) assert.deepEqual(current.find(c => c.id === car.id), { ...car, demo_display_order: null });
  assert.equal(current.filter(c => c.demo_display_order !== null).length, 7);
});

test('does not populate a legacy installation that lacks the original demo fleet', async () => {
  await db.exec("UPDATE cars SET plate_number = CONCAT('LEGACY-', id)");
  const original = await allCars();
  await db.exec(catalogMigration);
  assert.deepEqual(await allCars(), original.map(c => ({ ...c, demo_display_order: null })));
});
