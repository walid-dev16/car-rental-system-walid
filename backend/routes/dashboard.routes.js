const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const router = express.Router();

/* Return operational summary for admin and staff */
router.get("/summary", auth, allowRoles("admin", "staff"), async (req, res) => {
  try {
    const carsCount = await pool.query("SELECT COUNT(*) FROM cars");
    const bookingsCount = await pool.query("SELECT COUNT(*) FROM bookings");
    const usersCount = await pool.query("SELECT COUNT(*) FROM users");

    const availableCars = await pool.query(
      "SELECT COUNT(*) FROM cars WHERE status = 'available'"
    );

    const bookedCars = await pool.query(
      "SELECT COUNT(*) FROM cars WHERE status = 'booked'"
    );

    const maintenanceCars = await pool.query(
      "SELECT COUNT(*) FROM cars WHERE status = 'maintenance'"
    );

    const latestBookings = await pool.query(
      `SELECT id, user_id, car_id, pickup_datetime, return_datetime, status
       FROM bookings
       ORDER BY id DESC
       LIMIT 5`
    );

    res.json({
      overview: {
        total_cars: Number(carsCount.rows[0].count),
        total_bookings: Number(bookingsCount.rows[0].count),
        total_users: Number(usersCount.rows[0].count),
      },
      fleet_breakdown: {
        available: Number(availableCars.rows[0].count),
        booked: Number(bookedCars.rows[0].count),
        maintenance: Number(maintenanceCars.rows[0].count),
      },
      recent_activity: latestBookings.rows,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load dashboard summary" });
  }
});

module.exports = router;