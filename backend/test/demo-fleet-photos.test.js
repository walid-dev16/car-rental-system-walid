const { test, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');

let db;
let photoMigration;
const readMigration = (name) => fs.readFile(path.join(__dirname, '../migrations', name), 'utf8');
const photos = async () => (await db.query('SELECT image_url FROM cars ORDER BY id')).rows.map(row => row.image_url);
const otherFields = async () => (await db.query("SELECT to_jsonb(cars) - 'image_url' AS fields FROM cars ORDER BY id")).rows;

before(async () => {
  db = await PGlite.create();
  await db.exec(await readMigration('001_initial_schema.sql'));
  await db.exec(await readMigration('002_demo_fleet.sql'));
  photoMigration = await readMigration('003_demo_fleet_photos.sql');
});
beforeEach(() => db.query('BEGIN'));
afterEach(() => db.query('ROLLBACK'));
after(() => db.close());

test('all eight original demo cars receive their model photo without changing other fields', async () => {
  const original = await otherFields();
  await db.exec(photoMigration);
  assert.deepEqual(await photos(), [
    '/fleet/corolla.webp', '/fleet/bmw-3.webp', '/fleet/tucson.webp', '/fleet/c200.webp',
    '/fleet/polo.webp', '/fleet/x5.webp', '/fleet/a6-e-tron.webp', '/fleet/cle.webp',
  ]);
  assert.deepEqual(await otherFields(), original);
  assert.equal((await db.query(photoMigration)).affectedRows, 0);
});

test('edited photos and vehicles with a different plate, make or model stay intact', async () => {
  await db.exec(`
    UPDATE cars SET image_url = '/custom/photo.webp' WHERE id = 1;
    UPDATE cars SET plate_number = 'DIFFERENT' WHERE id = 2;
    UPDATE cars SET brand = 'Different' WHERE id = 3;
    UPDATE cars SET model = 'Different' WHERE id = 4;
    UPDATE cars SET image_url = (SELECT image_url FROM cars WHERE id = 13) WHERE id = 9;
    UPDATE cars SET image_url = '   ' WHERE id = 13;
  `);
  const expected = await photos();
  expected[4] = '/fleet/polo.webp';
  expected[6] = '/fleet/a6-e-tron.webp';
  expected[7] = '/fleet/cle.webp';
  await db.exec(photoMigration);
  assert.deepEqual(await photos(), expected);
});
