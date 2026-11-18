const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const { effectiveStatus, fleetStatus } = require("../booking-availability");

const router = express.Router();

router.get("/summary", auth, allowRoles("admin", "staff"), async (req, res) => {
  try {
    const [{ rows: [counts] }, recent] = await Promise.all([
      pool.query(
        `WITH fleet AS MATERIALIZED (SELECT ${fleetStatus()} AS status FROM cars c)
         SELECT count(*) AS total_cars, (SELECT count(*) FROM bookings) AS total_bookings,
                (SELECT count(*) FROM users) AS total_users,
                count(*) FILTER (WHERE status = 'available') AS available,
                count(*) FILTER (WHERE status = 'booked') AS booked,
                count(*) FILTER (WHERE status = 'maintenance') AS maintenance
         FROM fleet`
      ),
      pool.query(
        `SELECT b.id, b.user_id, b.car_id, b.pickup_datetime AT TIME ZONE 'Europe/Berlin' AS pickup_datetime,
                b.return_datetime AT TIME ZONE 'Europe/Berlin' AS return_datetime, ${effectiveStatus} AS status
         FROM bookings b ORDER BY b.id DESC LIMIT 5`
      ),
    ]);
    res.json({
      overview: { total_cars: Number(counts.total_cars), total_bookings: Number(counts.total_bookings), total_users: Number(counts.total_users) },
      fleet_breakdown: { available: Number(counts.available), booked: Number(counts.booked), maintenance: Number(counts.maintenance) },
      recent_activity: recent.rows,
    });
  } catch {
    res.status(500).json({ message: "Failed to load dashboard summary" });
  }
});

module.exports = router;
