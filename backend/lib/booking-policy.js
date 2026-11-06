// Documented booking limits; SQL and policy tests consume the same constants.
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RENTAL_DAYS = 30;
const BOOKING_HORIZON_DAYS = 365;
const PICKUP_CLOCK_SKEW_MS = 5 * 60 * 1000;
const PENDING_HOLD_MINUTES = 15;
const MAX_PENDING_PER_CUSTOMER = 3;
const MAX_AMOUNT_CENTS = 9999999999; // PostgreSQL NUMERIC(10,2).
const MAX_PG_ID = 9223372036854775807n;

class BookingError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function parseId(value, label = "ID") {
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value) || value <= 0) throw new BookingError(400, `Invalid ${label}`);
    return String(value);
  }
  if (typeof value !== "string" || !/^\d{1,19}$/.test(value)) throw new BookingError(400, `Invalid ${label}`);
  const id = BigInt(value);
  if (id <= 0n || id > MAX_PG_ID) throw new BookingError(400, `Invalid ${label}`);
  return String(id);
}

function requireBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new BookingError(400, "Invalid booking details");
}

function parseTimestamp(value) {
  // Explicit seconds/timezone prevent server-local interpretation. Date.parse
  // alone normalizes invalid calendar dates such as February 30.
  const match = typeof value === "string" && value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/
  );
  if (!match) throw new BookingError(400, "Datetimes must be ISO timestamps with a timezone");
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, , zone] = match;
  const [year, month, day, hour, minute, second] =
    [yearText, monthText, dayText, hourText, minuteText, secondText].map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const badZone = zone !== "Z" && (Number(zone.slice(1, 3)) > 23 || Number(zone.slice(4)) > 59);
  const timestamp = Date.parse(value);
  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > daysInMonth ||
      hour > 23 || minute > 59 || second > 59 || badZone || !Number.isFinite(timestamp)) {
    throw new BookingError(400, "Invalid datetime");
  }
  return timestamp;
}

function validateDates(pickup, returning, { allowPast = false, now = Date.now() } = {}) {
  const start = parseTimestamp(pickup);
  const end = parseTimestamp(returning);
  if (end <= start) throw new BookingError(400, "Return date must be after pickup date");
  if (end - start > MAX_RENTAL_DAYS * DAY_MS) throw new BookingError(400, `Rentals cannot exceed ${MAX_RENTAL_DAYS} days`);
  if (!allowPast && start < now - PICKUP_CLOCK_SKEW_MS) throw new BookingError(400, "Pickup date cannot be in the past");
  if (!allowPast && end > now + BOOKING_HORIZON_DAYS * DAY_MS) throw new BookingError(400, `Bookings must end within ${BOOKING_HORIZON_DAYS} days`);
  return { pickup: new Date(start).toISOString(), returning: new Date(end).toISOString(), days: Math.ceil((end - start) / DAY_MS) };
}

function moneyToCents(value) {
  if ((typeof value !== "string" && typeof value !== "number") ||
      (typeof value === "number" && !Number.isFinite(value))) throw new BookingError(400, "Invalid amount");
  const text = String(value);
  if (!/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/.test(text)) throw new BookingError(400, "Amount must be positive with at most two decimal places");
  const [whole, fraction = ""] = text.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (cents <= 0 || cents > MAX_AMOUNT_CENTS) throw new BookingError(400, "Invalid amount");
  return cents;
}

function formatCents(cents) {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

function quoteRental(dailyPrice, days) {
  let dailyCents;
  try { dailyCents = moneyToCents(dailyPrice); }
  catch { throw new BookingError(503, "Car price is unavailable"); }
  const total = dailyCents * days;
  if (!Number.isSafeInteger(total) || total <= 0 || total > MAX_AMOUNT_CENTS) throw new BookingError(400, "Booking amount exceeds the supported limit");
  return formatCents(total);
}

function validateCreate(body, user, now = Date.now()) {
  requireBody(body);
  const self = parseId(user.id, "authenticated user ID");
  const owner = body.user_id === undefined ? self : parseId(body.user_id, "user ID");
  if (user.role === "customer" && owner !== self) throw new BookingError(403, "Customers can only create their own bookings");
  const car = parseId(body.car_id, "car ID");
  const dates = validateDates(body.pickup_datetime, body.return_datetime, { now });
  const payment = body.payment_method === undefined ? "cash" : body.payment_method;
  if (!["cash", "card", "bank_transfer"].includes(payment)) throw new BookingError(400, "Invalid payment method");
  const notes = body.notes === undefined || body.notes === null ? null : body.notes;
  if (notes !== null && (typeof notes !== "string" || notes.length > 2000)) throw new BookingError(400, "Notes must be text with at most 2000 characters");
  // Ignore client total_price; only the locked car price is authoritative.
  return { owner, car, ...dates, payment, notes };
}

module.exports = {
  DAY_MS, MAX_RENTAL_DAYS, BOOKING_HORIZON_DAYS, PICKUP_CLOCK_SKEW_MS,
  PENDING_HOLD_MINUTES, MAX_PENDING_PER_CUSTOMER, MAX_AMOUNT_CENTS,
  BookingError, parseId, requireBody, parseTimestamp, validateDates,
  moneyToCents, formatCents, quoteRental, validateCreate,
};
