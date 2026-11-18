// Pending requests expire from their original creation time, including after an edit.
function positiveSetting(name, fallback) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value < 1 || value > 2147483647) {
    throw new Error(`Invalid booking setting: ${name}`);
  }
  return value;
}

const holdHours = positiveSetting("BOOKING_HOLD_HOURS", 24);
const customerHoldLimit = positiveSetting("BOOKING_MAX_PENDING_PER_CUSTOMER", 3);
const customerRentalDays = positiveSetting("BOOKING_MAX_RENTAL_DAYS", 30);
const recentPending = `(b.created_at > statement_timestamp()::timestamp - ${holdHours} * interval '1 hour'
  AND b.return_datetime > (statement_timestamp() AT TIME ZONE 'Europe/Berlin'))`;
const effectiveStatus = `CASE WHEN b.status = 'pending' AND NOT COALESCE((${recentPending}), false)
  THEN 'expired' ELSE b.status END`;

class BookingError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const dateTimeFormat = /^\d{4}-\d{2}-\d{2}[T ](?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,6})?)?(?:Z|[+-]\d{2}:\d{2})?$/i;
const hasOffset = /(?:Z|[+-]\d{2}:\d{2})$/i;

async function bookingPeriod(client, { pickup_datetime: pickup, return_datetime: dropoff }) {
  if (![pickup, dropoff].every(value => typeof value === 'string' && dateTimeFormat.test(value))) {
    throw new BookingError(400, 'Invalid datetime format');
  }
  // The browser sends branch wall times. Offset-bearing inputs already denote an instant.
  const { rows: [period] } = await client.query(
    `WITH instants AS (
       SELECT CASE WHEN $3 THEN $1::text::timestamptz ELSE $1::text::timestamp AT TIME ZONE 'Europe/Berlin' END AS start_at,
              CASE WHEN $4 THEN $2::text::timestamptz ELSE $2::text::timestamp AT TIME ZONE 'Europe/Berlin' END AS end_at
     ), local_times AS (
       SELECT *, start_at AT TIME ZONE 'Europe/Berlin' AS pickup, end_at AT TIME ZONE 'Europe/Berlin' AS dropoff FROM instants
     )
     SELECT pickup::text, dropoff::text, ceil(extract(epoch FROM end_at - start_at) / 86400)::integer AS days,
            start_at >= statement_timestamp() AS future,
            ($3 OR pickup = $1::text::timestamp) AND ($4 OR dropoff = $2::text::timestamp)
            AND start_at = (pickup AT TIME ZONE 'Europe/Berlin') AND end_at = (dropoff AT TIME ZONE 'Europe/Berlin') AS representable
     FROM local_times`,
    [pickup, dropoff, hasOffset.test(pickup), hasOffset.test(dropoff)]
  );
  if (!period.representable) throw new BookingError(400, 'Choose a time outside the daylight-saving clock change');
  if (period.days <= 0) throw new BookingError(400, 'Return date must be after pickup date');
  return period;
}

// Operational blocks are set by fleet staff. Original booking-derived flags are annotated by migration 002.
const operationalStatus = `CASE WHEN c.status_from_booking AND c.status = 'booked' THEN 'available' ELSE c.status END`;
const inventoryBooking = `(${effectiveStatus}) NOT IN ('cancelled', 'expired', 'completed', 'returned')`;
const branchNow = "(statement_timestamp() AT TIME ZONE 'Europe/Berlin')";
const coversNow = `b.pickup_datetime <= ${branchNow} AND b.return_datetime > ${branchNow}`;

function overlapsPeriod(startParameter, endParameter) {
  return `b.pickup_datetime < ${endParameter}::timestamp AND b.return_datetime > ${startParameter}::timestamp`;
}

// All supplied SQL expressions below are internal. Request values are bound by the callers.
function fleetStatus(overlap = coversNow) {
  return `CASE WHEN (${operationalStatus}) <> 'available' THEN (${operationalStatus})
    WHEN EXISTS (SELECT 1 FROM bookings b WHERE b.car_id = c.id AND ${inventoryBooking} AND (${overlap}))
    THEN 'booked' ELSE 'available' END`;
}

module.exports = {
  BookingError, bookingPeriod, customerHoldLimit, customerRentalDays, effectiveStatus,
  recentPending, inventoryBooking, operationalStatus, coversNow, overlapsPeriod, fleetStatus,
};
