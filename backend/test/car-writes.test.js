const { test, mock } = require("node:test");
const assert = require("node:assert/strict");
const { carValues, CarInputError } = require("../car-input");

const db = { query: mock.fn() };
require.cache[require.resolve("../db")] = { exports: db };
require.cache[require.resolve("../middleware/auth.middleware")] = {
  exports(req, res, next) { req.user = { id: "1", role: "admin" }; next(); },
};
const cars = require("../routes/cars.routes");
const car = {
  brand: " Sample ", model: "Test", production_year: "2020", category: " Sedan ",
  plate_number: " DEMO-1 ", seats: "5", transmission: "Automatic", fuel_type: "PETROL",
  daily_price: "44.75", available_branches: ["erfurt", " Berlin ", "Erfurt"],
};

function write(method, url, body) {
  return new Promise((resolve, reject) => {
    const req = { method, url, body, headers: {} };
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(data) { resolve({ code: this.statusCode, data }); },
    };
    cars.handle(req, res, (err) => reject(err ?? new Error("Route not found")));
  });
}

test("create normalizes text, money, branches and default status; updating requires an explicit status", async () => {
  const queries = [];
  db.query.mock.mockImplementation(async (sql, values) => {
    queries.push({ sql, values });
    return { rows: [{ id: "3" }] };
  });
  assert.equal((await write("POST", "/", car)).code, 201);
  assert.deepEqual(queries[0].values, [
    "Sample", "Test", 2020, "sedan", "DEMO-1", 5, "automatic", "petrol", "44.75",
    "available", null, null, "Erfurt, Berlin", null, null, null, null,
  ]);
  assert.equal((await write("PUT", "/3", car)).code, 400);
  assert.equal((await write("PUT", "/3", { ...car, status: " MAINTENANCE ", category: "Estate" })).code, 200);
  assert.equal(queries[1].values[9], "maintenance");
  assert.equal(queries[1].values[3], "estate");
  assert.deepEqual(queries[1].values.slice(17), ["3", false]);
  assert.equal((await write("PATCH", "/3/status", { status: " Booked " })).code, 200);
  assert.deepEqual(queries[2].values, ["booked", "3"]);
  assert.match(queries[2].sql, /status_from_booking = FALSE/);
  for (const [method, url] of [["POST", "/"], ["PUT", "/3"], ["PATCH", "/3/status"]]) {
    assert.equal((await write(method, url, { ...car, status: "unrecognized" })).code, 400);
  }
  assert.equal(queries.length, 3);
});

test("invalid fields fail before a fleet write and valid local image paths and nullable fields work", () => {
  const invalid = [
    { seats: true }, { seats: 0 }, { seats: 2.2 }, { production_year: new Date().getFullYear() + 2 },
    { doors: "x" }, { doors: {} }, { daily_price: 0 }, { daily_price: "-1" },
    { daily_price: "4.321" }, { daily_price: "100000000.00" }, { daily_price: [] },
    { image_url: "file:///invalid" }, { available_branches: "Berlin, Nowhere" },
    { model: " " }, { brand: "a".repeat(51) }, { fuel_type: [] }, { description: {} },
  ];
  for (const fields of invalid) {
    assert.throws(() => carValues({ ...car, ...fields }, "available"), CarInputError);
  }
  const values = carValues({ ...car, image_url: "/fleet/sample.jpg", doors: "", available_branches: " " }, "available");
  assert.equal(values[10], "/fleet/sample.jpg");
  assert.equal(values[12], null);
  assert.equal(values[16], null);
});

test("fleet writes identify missing cars and duplicate plates", async () => {
  db.query.mock.mockImplementation(async () => ({ rows: [] }));
  assert.equal((await write("PUT", "/99", { ...car, status: "available" })).code, 404);
  assert.equal((await write("PATCH", "/99/status", { status: "available" })).code, 404);
  db.query.mock.mockImplementation(async () => { throw Object.assign(new Error(), { code: "23505" }); });
  assert.equal((await write("POST", "/", car)).code, 409);
});
