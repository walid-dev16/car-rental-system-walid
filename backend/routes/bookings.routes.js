const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const router = express.Router();

/* Return bookings for the authenticated customer */
router.get("/my", auth, allowRoles("customer"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        b.*,
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
        b.*,
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

/* Create booking and prevent date conflicts */
router.post("/", auth, allowRoles("admin", "staff", "customer"), async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      user_id,
      car_id,
      pickup_datetime,
      return_datetime,
      total_price,
      payment_method,
      notes,
    } = req.body;

    if (!user_id || !car_id || !pickup_datetime || !return_datetime || !total_price) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const start = new Date(pickup_datetime);
    const end = new Date(return_datetime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid datetime format" });
    }

    if (end <= start) {
      return res.status(400).json({ message: "Return date must be after pickup date" });
    }

    await client.query("BEGIN");

    const carRes = await client.query(
      "SELECT status FROM cars WHERE id = $1 FOR UPDATE",
      [car_id]
    );

    if (carRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Car not found" });
    }

    if (carRes.rows[0].status === "maintenance") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Car is currently in maintenance" });
    }

    const overlap = await client.query(
      `SELECT 1 FROM bookings
       WHERE car_id = $1
         AND status NOT IN ('cancelled')
         AND ($2 < return_datetime) AND ($3 > pickup_datetime)
       LIMIT 1`,
      [car_id, pickup_datetime, return_datetime]
    );

    if (overlap.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Car is already reserved for this time period" });
    }

    const bookingResult = await client.query(
      `INSERT INTO bookings
      (
        user_id,
        car_id,
        pickup_datetime,
        return_datetime,
        total_price,
        payment_method,
        notes,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *`,
      [
        user_id,
        car_id,
        pickup_datetime,
        return_datetime,
        total_price,
        payment_method || "cash",
        notes || null,
      ]
    );

    await client.query("COMMIT");
    res.status(201).json(bookingResult.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

router.patch("/:id/complete", auth, allowRoles("admin", "staff"), async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE bookings
       SET status = 'booked', updated_at = NOW()
       WHERE id = $1 AND status NOT IN ('booked', 'cancelled')
       RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Booking not found or already processed" });
    }

    await client.query(
      `UPDATE cars
       SET status = 'booked', updated_at = NOW()
       WHERE id = $1`,
      [result.rows[0].car_id]
    );

    await client.query("COMMIT");
    res.json({ message: "Booking confirmed ", booking: result.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

router.patch("/:id/cancel", auth, allowRoles("admin", "staff"), async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE bookings
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND status NOT IN ('cancelled')
       RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Booking not found or already processed" });
    }

    await client.query(
      `UPDATE cars
       SET status = 'available', updated_at = NOW()
       WHERE id = $1`,
      [result.rows[0].car_id]
    );

    await client.query("COMMIT");
    res.json({ message: "Booking cancelled ", booking: result.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

router.delete("/:id", auth, allowRoles("admin"), async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const bookingRes = await client.query(
      `SELECT * FROM bookings WHERE id = $1 FOR UPDATE`,
      [req.params.id]
    );

    if (bookingRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = bookingRes.rows[0];

    await client.query(`DELETE FROM bookings WHERE id = $1`, [req.params.id]);

    const activeBookingsRes = await client.query(
      `SELECT 1
       FROM bookings
       WHERE car_id = $1
         AND status NOT IN ('cancelled')
       LIMIT 1`,
      [booking.car_id]
    );

    if (activeBookingsRes.rows.length === 0) {
      await client.query(
        `UPDATE cars
         SET status = 'available', updated_at = NOW()
         WHERE id = $1`,
        [booking.car_id]
      );
    }

    await client.query("COMMIT");

    res.json({
      message: "Booking deleted successfully ",
      booking,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

router.put("/:id", auth, allowRoles("admin"), async (req, res) => {
  const client = await pool.connect();

  try {
    const { pickup_datetime, return_datetime, total_price } = req.body;

    if (!pickup_datetime || !return_datetime || !total_price) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const start = new Date(pickup_datetime);
    const end = new Date(return_datetime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid datetime format" });
    }

    if (end <= start) {
      return res.status(400).json({ message: "Return date must be after pickup date" });
    }

    await client.query("BEGIN");

    const bookingRes = await client.query(
      `SELECT * FROM bookings WHERE id = $1 FOR UPDATE`,
      [req.params.id]
    );

    if (bookingRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = bookingRes.rows[0];

    const overlapRes = await client.query(
      `SELECT 1
       FROM bookings
       WHERE car_id = $1
         AND id <> $2
         AND status NOT IN ('cancelled')
         AND ($3 < return_datetime) AND ($4 > pickup_datetime)
       LIMIT 1`,
      [booking.car_id, booking.id, pickup_datetime, return_datetime]
    );

    if (overlapRes.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Car is already reserved for this time period" });
    }

    const result = await client.query(
      `UPDATE bookings
       SET pickup_datetime = $1,
           return_datetime = $2,
           total_price = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [pickup_datetime, return_datetime, total_price, req.params.id]
    );

    await client.query("COMMIT");
    res.json({
      message: "Booking updated successfully ✅",
      booking: result.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

module.exports = router;