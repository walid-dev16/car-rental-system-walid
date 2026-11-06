const test = require("node:test");
const assert = require("node:assert/strict");
const {
  DAY_MS, MAX_RENTAL_DAYS, BOOKING_HORIZON_DAYS, PICKUP_CLOCK_SKEW_MS,
  MAX_AMOUNT_CENTS, BookingError, parseId, parseTimestamp, validateDates,
  moneyToCents, quoteRental, validateCreate,
} = require("../lib/booking-policy");

const NOW = Date.parse("2026-11-06T12:00:00Z");
const iso = (ms) => new Date(ms).toISOString();
const customer = { id: "7", role: "customer" };
const valid = () => ({ car_id: "8", pickup_datetime: iso(NOW + DAY_MS), return_datetime: iso(NOW + 2 * DAY_MS) });
const rejects = (fn, status = 400) => assert.throws(fn, (err) => err instanceof BookingError && err.status === status);

test("IDs preserve the full PostgreSQL bigint range and reject unsafe JS numbers", () => {
  assert.equal(parseId("9223372036854775807"), "9223372036854775807");
  assert.equal(parseId(Number.MAX_SAFE_INTEGER), String(Number.MAX_SAFE_INTEGER));
  assert.equal(parseId("0007"), "7");
  for (const value of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity,
    "9223372036854775808", "0", "-1", "1.0", "1e2", "", " 7", null, [], {}]) {
    rejects(() => parseId(value));
  }
});

test("timestamps require a timezone and an actual calendar date", () => {
  assert.equal(parseTimestamp("2028-02-29T13:00:00+01:00"), Date.parse("2028-02-29T12:00:00Z"));
  assert.equal(parseTimestamp("2026-11-06T12:00:00.123Z"), NOW + 123);
  for (const value of ["2026-11-06T12:00", "2026-11-06T12:00:00", "2026-02-30T12:00:00Z",
    "2027-02-29T12:00:00Z", "2026-11-06T24:00:00Z", "2026-11-06T12:60:00Z",
    "2026-11-06T12:00:00+24:00", "2026-11-06", 0, null, {}]) {
    rejects(() => parseTimestamp(value));
  }
});

test("date bounds include exact limits and reject a millisecond beyond them", () => {
  const options = { now: NOW };
  assert.equal(validateDates(iso(NOW), iso(NOW + MAX_RENTAL_DAYS * DAY_MS), options).days, 30);
  rejects(() => validateDates(iso(NOW), iso(NOW + MAX_RENTAL_DAYS * DAY_MS + 1), options));
  assert.equal(validateDates(iso(NOW - PICKUP_CLOCK_SKEW_MS), iso(NOW + DAY_MS), options).days, 2);
  rejects(() => validateDates(iso(NOW - PICKUP_CLOCK_SKEW_MS - 1), iso(NOW + DAY_MS), options));
  const horizon = NOW + BOOKING_HORIZON_DAYS * DAY_MS;
  validateDates(iso(horizon - DAY_MS), iso(horizon), options);
  rejects(() => validateDates(iso(horizon - DAY_MS), iso(horizon + 1), options));
  rejects(() => validateDates(iso(NOW), iso(NOW), options));
  rejects(() => validateDates(iso(NOW + DAY_MS), iso(NOW), options));
});

test("admin edits allow historical dates but retain duration bounds", () => {
  const options = { allowPast: true, now: NOW };
  assert.equal(validateDates("2020-01-01T00:00:00Z", "2020-01-02T00:00:00Z", options).days, 1);
  rejects(() => validateDates("2020-01-01T00:00:00Z", "2020-02-01T00:00:00Z", options));
});

test("prices use exact integer cents, round partial rental days, and fit NUMERIC(10,2)", () => {
  assert.equal(moneyToCents("99999999.99"), MAX_AMOUNT_CENTS);
  assert.equal(moneyToCents(0.01), 1);
  assert.equal(quoteRental("19.99", 3), "59.97");
  const dates = validateDates(iso(NOW), iso(NOW + DAY_MS + 1), { now: NOW });
  assert.equal(quoteRental("0.10", dates.days), "0.20");
  assert.equal(quoteRental("99999999.99", 1), "99999999.99");
  rejects(() => quoteRental("99999999.99", 2));
  for (const value of [0, -1, Infinity, NaN, "1.001", "100000000", "1e3", "", [], {}, null, true]) rejects(() => moneyToCents(value));
  rejects(() => quoteRental("corrupt", 1), 503);
});

test("customers own their bookings and client totals never enter the validated input", () => {
  const withoutOwner = validateCreate(valid(), customer, NOW);
  assert.equal(withoutOwner.owner, "7");
  assert.equal(validateCreate({ ...valid(), user_id: 7 }, customer, NOW).owner, "7");
  rejects(() => validateCreate({ ...valid(), user_id: "8" }, customer, NOW), 403);
  assert.equal(validateCreate({ ...valid(), user_id: "8" }, { id: "1", role: "staff" }, NOW).owner, "8");
  assert.equal(validateCreate(valid(), { id: "1", role: "admin" }, NOW).owner, "1");
  for (const total_price of [-1, 0.01, "tampered", Infinity, { value: 1 }]) {
    assert.deepEqual(validateCreate({ ...valid(), total_price }, customer, NOW), withoutOwner);
  }
});

test("booking metadata rejects wrong types and limits notes", () => {
  assert.equal(validateCreate({ ...valid(), notes: "a".repeat(2000), payment_method: "bank_transfer" }, customer, NOW).notes.length, 2000);
  for (const body of [null, [], "booking", { ...valid(), notes: "a".repeat(2001) },
    { ...valid(), notes: {} }, { ...valid(), payment_method: {} },
    { ...valid(), payment_method: "crypto" }, { ...valid(), user_id: null }]) {
    rejects(() => validateCreate(body, customer, NOW));
  }
});
