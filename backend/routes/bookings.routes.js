const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const {
  BookingError, bookingPeriod, customerHoldLimit, customerRentalDays, effectiveStatus,
  recentPending, inventoryBooking, operationalStatus, overlapsPeriod,
} = require("../booking-availability");
const { bookingBranches } = require("../branches");

const router = express.Router();

// The legacy columns store German branch wall times. Return instants to API clients.
const bookingFields = `b.*,
  b.pickup_datetime AT TIME ZONE 'Europe/Berlin' AS pickup_datetime,
  b.return_datetime AT TIME ZONE 'Europe/Berlin' AS return_datetime,
  ${effectiveStatus} AS status`;

/* Return bookings for the authenticated customer */
router.get("/my", auth, allowRoles("customer"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        ${bookingFields},
        c.brand AS car_brand,
        c.model AS car_model,
        c.plate_number AS car_plate_number,
        c.image_url AS car_image_url,
        c.daily_price AS car_daily_price
      FROM bookings b
      JOIN cars c ON b.car_id = c.id
      WHERE b.user_id = $1
      ORDER BY b.id DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* Return all bookings for admin and staff */
router.get("/", auth, allowRoles("admin", "staff"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        ${bookingFields},
        u.email AS customer_email,
        u.first_name AS customer_first_name,
        u.last_name AS customer_last_name,
        c.brand AS car_brand,
        c.model AS car_model,
        c.plate_number AS car_plate_number,
        c.image_url AS car_image_url
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN cars c ON b.car_id = c.id
      ORDER BY b.id DESC`
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

function bookingId(value) {
  const scalarId = typeof value === 'string' || Number.isSafeInteger(value);
  if (!scalarId || !/^[1-9]\d{0,18}$/.test(value) || BigInt(value) > 9223372036854775807n) {
    throw new BookingError(400, 'Invalid user, car or booking ID');
  }
  return String(value);
}

// Store and multiply integer cents only. PostgreSQL NUMERIC(10,2) holds up to 9,999,999,999 cents.
function amountForDays(rate, days) {
  const priceText = typeof rate === 'string' || typeof rate === 'number' ? String(rate) : '';
  const parts = /^(\d{1,8})(?:\.(\d{1,2}))?$/.exec(priceText);
  if (!parts) throw new BookingError(400, 'Price must be a positive amount with at most two decimal places');
  const dailyCents = BigInt(parts[1]) * 100n + BigInt((parts[2] || '').padEnd(2, '0'));
  const cents = dailyCents * BigInt(days);
  if (cents <= 0n || cents > 9999999999n) {
    throw new BookingError(400, 'Price is outside the supported range');
  }
  return `${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`;
}

function transaction(operation, successStatus = 200) {
  return async (req, res) => {
    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      const body = await operation(client, req);
      await client.query('COMMIT');
      res.status(successStatus).json(body);
    } catch (error) {
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch {
          client.release(true);
          client = null;
        }
      }
      if (error instanceof BookingError) return res.status(error.status).json({ message: error.message });
      if (['22007', '22008', '22009'].includes(error.code)) return res.status(400).json({ message: 'Invalid datetime format' });
      if (error.code === '23503') return res.status(409).json({ message: 'User or car no longer exists' });
      res.status(500).json({ message: 'Server error' });
    } finally {
      if (client) client.release();
    }
  };
}

async function lockCarForBooking(client, id) {
  // Every booking mutation takes the vehicle lock first. Read the booking again after acquiring it.
  const { rows: [car] } = await client.query(
    `SELECT c.id, ${operationalStatus} AS status, c.daily_price, c.available_branches
     FROM cars c JOIN bookings b ON b.car_id = c.id WHERE b.id = $1 FOR UPDATE OF c`, [id]
  );
  if (!car) throw new BookingError(404, 'Booking not found');
  const { rows: [booking] } = await client.query(
    `SELECT b.id, ${effectiveStatus} AS status, b.pickup_datetime::text AS pickup, b.return_datetime::text AS dropoff
     FROM bookings b WHERE b.id = $1 AND b.car_id = $2 FOR UPDATE`, [id, car.id]
  );
  if (!booking) throw new BookingError(404, 'Booking not found');
  return { car, booking };
}

async function requireAvailable(client, car, period, excludedBooking = null) {
  if (car.status === 'maintenance') throw new BookingError(400, 'Car is currently in maintenance');
  if (car.status !== 'available') throw new BookingError(400, 'Car is unavailable for reservation');
  const { rowCount } = await client.query(
    `SELECT 1 FROM bookings b WHERE b.car_id = $1 AND b.id IS DISTINCT FROM $4::bigint
       AND ${inventoryBooking}
       AND ${overlapsPeriod('$2', '$3')} LIMIT 1`,
    [car.id, period.pickup, period.dropoff, excludedBooking]
  );
  if (rowCount) throw new BookingError(400, 'Car is already reserved for this time period');
}

router.post('/', auth, allowRoles('admin', 'staff', 'customer'), transaction(async (client, req) => {
  const body = req.body || {};
  const customer = req.user.role === 'customer';
  const userId = bookingId(customer ? req.user.id : body.user_id);
  const carId = bookingId(body.car_id);
  // Serialize pending-quota checks for the same account, even for different cars.
  const owner = await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [userId]);
  if (!owner.rowCount) throw new BookingError(404, 'User not found');
  const { rows: [car] } = await client.query(`SELECT c.id, ${operationalStatus} AS status, c.daily_price, c.available_branches FROM cars c WHERE c.id = $1 FOR UPDATE`, [carId]);
  if (!car) throw new BookingError(404, 'Car not found');
  const branches = bookingBranches(body, car.available_branches);
  const period = await bookingPeriod(client, body);
  if (!period.future) throw new BookingError(400, 'Pickup must be in the future');
  if (customer) {
    if (period.days > customerRentalDays) throw new BookingError(400, `Online rentals are limited to ${customerRentalDays} days`);
    const pending = await client.query(
      `SELECT count(*) AS count FROM bookings b WHERE b.user_id = $1 AND b.status = 'pending' AND ${recentPending}`, [userId]
    );
    if (Number(pending.rows[0].count) >= customerHoldLimit) throw new BookingError(409, 'Pending reservation limit reached');
  }
  await requireAvailable(client, car, period);
  const amount = amountForDays(car.daily_price, period.days);
  const { rows: [booking] } = await client.query(
    `INSERT INTO bookings AS b (user_id, car_id, pickup_datetime, return_datetime, total_price, payment_method, notes, pickup_branch, dropoff_branch, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending') RETURNING ${bookingFields}`,
    [userId, carId, period.pickup, period.dropoff, amount, body.payment_method || 'cash', body.notes || null, branches.pickup, branches.dropoff]
  );
  return booking;
}, 201));

router.patch('/:id/complete', auth, allowRoles('admin', 'staff'), transaction(async (client, req) => {
  const { car, booking } = await lockCarForBooking(client, bookingId(req.params.id));
  if (booking.status === 'expired') throw new BookingError(409, 'The pending reservation has expired');
  if (booking.status !== 'pending') throw new BookingError(404, 'Booking not found or already processed');
  await requireAvailable(client, car, booking, booking.id);
  const { rows: [confirmed] } = await client.query(
    `UPDATE bookings AS b SET status = 'booked', updated_at = NOW()
     WHERE b.id = $1 AND b.status = 'pending' AND ${recentPending} RETURNING ${bookingFields}`, [booking.id]
  );
  if (!confirmed) throw new BookingError(409, 'The pending reservation has expired');
  return { message: 'Booking confirmed ', booking: confirmed };
}));

router.patch('/:id/cancel', auth, allowRoles('admin', 'staff'), transaction(async (client, req) => {
  const { booking } = await lockCarForBooking(client, bookingId(req.params.id));
  if (booking.status === 'cancelled') throw new BookingError(404, 'Booking not found or already processed');
  const { rows: [cancelled] } = await client.query(
    `UPDATE bookings AS b SET status = 'cancelled', updated_at = NOW() WHERE b.id = $1 RETURNING ${bookingFields}`, [booking.id]
  );
  return { message: 'Booking cancelled ', booking: cancelled };
}));

router.delete('/:id', auth, allowRoles('admin'), transaction(async (client, req) => {
  const { booking } = await lockCarForBooking(client, bookingId(req.params.id));
  const { rows: [deleted] } = await client.query(`DELETE FROM bookings AS b WHERE b.id = $1 RETURNING ${bookingFields}`, [booking.id]);
  return { message: 'Booking deleted successfully ', booking: deleted };
}));

router.put('/:id', auth, allowRoles('admin'), transaction(async (client, req) => {
  const { car, booking } = await lockCarForBooking(client, bookingId(req.params.id));
  if (booking.status === 'expired') throw new BookingError(409, 'The pending reservation has expired');
  const body = req.body || {};
  const period = await bookingPeriod(client, body);
  if (booking.status !== 'cancelled') await requireAvailable(client, car, period, booking.id);
  // Administrators can specify an agreed total in the existing edit form.
  const amount = body.total_price === undefined ? amountForDays(car.daily_price, period.days) : amountForDays(body.total_price, 1);
  const { rows: [updated] } = await client.query(
    `UPDATE bookings AS b SET pickup_datetime = $1, return_datetime = $2, total_price = $3, updated_at = NOW()
     WHERE b.id = $4 AND (b.status <> 'pending' OR ${recentPending}) RETURNING ${bookingFields}`,
    [period.pickup, period.dropoff, amount, booking.id]
  );
  if (!updated) throw new BookingError(409, 'The pending reservation has expired');
  return { message: 'Booking updated successfully ✅', booking: updated };
}));

module.exports = router;
