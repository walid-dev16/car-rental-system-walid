const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const {
  BookingError, parseId, requireBody, validateCreate, validateDates,
  moneyToCents, formatCents, quoteRental, PENDING_HOLD_MINUTES, MAX_PENDING_PER_CUSTOMER,
} = require("../lib/booking-policy");

const router = express.Router();
const effectiveExpiry = `COALESCE(expires_at, created_at + INTERVAL '${PENDING_HOLD_MINUTES} minutes')`;
const activeReservation = `(status = 'booked' OR (status = 'pending' AND ${effectiveExpiry} > NOW()))`;
const displayedStatus = `CASE WHEN b.status = 'pending' AND COALESCE(b.expires_at, b.created_at + INTERVAL '${PENDING_HOLD_MINUTES} minutes') <= NOW() THEN 'expired' ELSE b.status END AS status`;

// Acquire inside the error boundary, roll back only an open transaction, and
// release even after BEGIN fails. Database details never enter the response.
function transaction(handler) {
  return async (req, res) => {
    let client;
    let begun = false;
    try {
      client = await pool.connect();
      await client.query("BEGIN");
      begun = true;
      const result = await handler(req, client);
      await client.query("COMMIT");
      begun = false;
      res.status(result.status || 200).json(result.body);
    } catch (err) {
      if (begun) {
        try { await client.query("ROLLBACK"); } catch { /* Preserve the original failure. */ }
      }
      if (err instanceof BookingError) res.status(err.status).json({ message: err.message });
      else res.status(client ? 500 : 503).json({ message: "Booking service unavailable" });
    } finally {
      if (client) client.release();
    }
  };
}

// All existing-booking mutations lock the car before the booking. Reading its
// immutable car_id first avoids booking/car deadlocks with creation.
async function lockBooking(client, id) {
  const reference = await client.query("SELECT car_id FROM bookings WHERE id = $1", [id]);
  if (!reference.rows.length) throw new BookingError(404, "Booking not found");
  const car = await client.query("SELECT id, status FROM cars WHERE id = $1 FOR UPDATE", [reference.rows[0].car_id]);
  const result = await client.query(
    `SELECT *, (status = 'pending' AND ${effectiveExpiry} <= NOW()) AS hold_expired
     FROM bookings WHERE id = $1 FOR UPDATE`, [id]
  );
  if (!car.rows.length || !result.rows.length) throw new BookingError(404, "Booking not found");
  return { booking: result.rows[0], car: car.rows[0] };
}

async function expireHold(client, booking) {
  if (booking.hold_expired) {
    await client.query("UPDATE bookings SET status = 'expired', updated_at = NOW() WHERE id = $1", [booking.id]);
    booking.status = "expired";
  }
}

async function assertAvailable(client, carId, pickup, returning, excludeId = null) {
  const overlap = await client.query(
    `SELECT 1 FROM bookings WHERE car_id = $1 AND ${activeReservation}
       AND ($2 < return_datetime) AND ($3 > pickup_datetime)
       AND ($4::bigint IS NULL OR id <> $4::bigint) LIMIT 1`,
    [carId, pickup, returning, excludeId]
  );
  if (overlap.rows.length) throw new BookingError(409, "Car is already reserved for this time period");
}

async function refreshCarStatus(client, carId) {
  // Pending requests and historical reservations do not set current fleet state.
  // Cancelling/deleting a booking must also preserve maintenance.
  await client.query(
    `UPDATE cars SET status = CASE WHEN EXISTS (
       SELECT 1 FROM bookings WHERE car_id = $1 AND status = 'booked'
         AND pickup_datetime <= NOW() AND return_datetime > NOW()
     ) THEN 'booked' ELSE 'available' END, updated_at = NOW()
     WHERE id = $1 AND status <> 'maintenance'`, [carId]
  );
}

router.get("/my", auth, allowRoles("customer"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, ${displayedStatus}, c.brand AS car_brand, c.model AS car_model,
         c.plate_number AS car_plate_number, c.image_url AS car_image_url,
         c.daily_price AS car_daily_price
       FROM bookings b JOIN cars c ON b.car_id = c.id
       WHERE b.user_id = $1 ORDER BY b.id DESC`, [req.user.id]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ message: "Booking service unavailable" });
  }
});

router.get("/", auth, allowRoles("admin", "staff"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, ${displayedStatus}, u.email AS customer_email,
         u.first_name AS customer_first_name, u.last_name AS customer_last_name,
         c.brand AS car_brand, c.model AS car_model,
         c.plate_number AS car_plate_number, c.image_url AS car_image_url
       FROM bookings b JOIN users u ON b.user_id = u.id
       JOIN cars c ON b.car_id = c.id ORDER BY b.id DESC`
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ message: "Booking service unavailable" });
  }
});

router.post("/", auth, allowRoles("admin", "staff", "customer"), transaction(async (req, client) => {
  const input = validateCreate(req.body, req.user);
  // Serialize an owner's quota even for simultaneous requests on different cars.
  const owner = await client.query("SELECT id, role, account_status FROM users WHERE id = $1 FOR UPDATE", [input.owner]);
  if (!owner.rows.length) throw new BookingError(404, "User not found");
  if (!["pending", "active", "approved"].includes(owner.rows[0].account_status)) throw new BookingError(403, "This account cannot create bookings");
  if (owner.rows[0].role === "customer") {
    const holds = await client.query(
      `SELECT COUNT(*) AS count FROM bookings WHERE user_id = $1
         AND status = 'pending' AND ${effectiveExpiry} > NOW()`, [input.owner]
    );
    if (Number(holds.rows[0].count) >= MAX_PENDING_PER_CUSTOMER) throw new BookingError(409, `A customer can have at most ${MAX_PENDING_PER_CUSTOMER} pending bookings`);
  }
  const car = await client.query("SELECT status, daily_price FROM cars WHERE id = $1 FOR UPDATE", [input.car]);
  if (!car.rows.length) throw new BookingError(404, "Car not found");
  if (car.rows[0].status === "maintenance") throw new BookingError(409, "Car is currently in maintenance");
  await assertAvailable(client, input.car, input.pickup, input.returning);
  const totalPrice = quoteRental(car.rows[0].daily_price, input.days);
  const booking = await client.query(
    `INSERT INTO bookings (user_id, car_id, pickup_datetime, return_datetime,
       total_price, payment_method, notes, status, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW() + INTERVAL '${PENDING_HOLD_MINUTES} minutes')
     RETURNING *`,
    [input.owner, input.car, input.pickup, input.returning, totalPrice, input.payment, input.notes]
  );
  return { status: 201, body: booking.rows[0] };
}));

router.patch("/:id/complete", auth, allowRoles("admin", "staff"), transaction(async (req, client) => {
  const id = parseId(req.params.id, "booking ID");
  const { booking, car } = await lockBooking(client, id);
  await expireHold(client, booking);
  if (booking.status !== "pending") {
    // Commit lazy expiration rather than rolling it back with an exception.
    return { status: 409, body: { message: "Booking is no longer pending" } };
  }
  if (car.status === "maintenance") throw new BookingError(409, "Car is currently in maintenance");
  await assertAvailable(client, booking.car_id, booking.pickup_datetime, booking.return_datetime, id);
  const result = await client.query(
    "UPDATE bookings SET status = 'booked', expires_at = NULL, updated_at = NOW() WHERE id = $1 RETURNING *", [id]
  );
  await refreshCarStatus(client, booking.car_id);
  return { body: { message: "Booking confirmed", booking: result.rows[0] } };
}));

router.patch("/:id/cancel", auth, allowRoles("admin", "staff"), transaction(async (req, client) => {
  const id = parseId(req.params.id, "booking ID");
  const { booking } = await lockBooking(client, id);
  await expireHold(client, booking);
  if (["cancelled", "expired"].includes(booking.status)) return { status: 409, body: { message: "Booking is no longer active" } };
  const result = await client.query(
    "UPDATE bookings SET status = 'cancelled', expires_at = NULL, updated_at = NOW() WHERE id = $1 RETURNING *", [id]
  );
  await refreshCarStatus(client, booking.car_id);
  return { body: { message: "Booking cancelled", booking: result.rows[0] } };
}));

router.delete("/:id", auth, allowRoles("admin"), transaction(async (req, client) => {
  const id = parseId(req.params.id, "booking ID");
  const { booking } = await lockBooking(client, id);
  await client.query("DELETE FROM bookings WHERE id = $1", [id]);
  await refreshCarStatus(client, booking.car_id);
  return { body: { message: "Booking deleted successfully", booking } };
}));

router.put("/:id", auth, allowRoles("admin"), transaction(async (req, client) => {
  const id = parseId(req.params.id, "booking ID");
  requireBody(req.body);
  const dates = validateDates(req.body.pickup_datetime, req.body.return_datetime, { allowPast: true });
  const totalPrice = formatCents(moneyToCents(req.body.total_price));
  const { booking } = await lockBooking(client, id);
  await expireHold(client, booking);
  if (!["pending", "booked"].includes(booking.status)) return { status: 409, body: { message: "Only active bookings can be edited" } };
  await assertAvailable(client, booking.car_id, dates.pickup, dates.returning, id);
  const result = await client.query(
    `UPDATE bookings SET pickup_datetime = $1, return_datetime = $2,
       total_price = $3, updated_at = NOW() WHERE id = $4 RETURNING *`,
    [dates.pickup, dates.returning, totalPrice, id]
  );
  await refreshCarStatus(client, booking.car_id);
  return { body: { message: "Booking updated successfully", booking: result.rows[0] } };
}));

module.exports = router;
