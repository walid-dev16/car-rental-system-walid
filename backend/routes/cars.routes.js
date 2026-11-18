const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const router = express.Router();

const { BookingError, bookingPeriod, fleetStatus, coversNow, overlapsPeriod, operationalStatus } = require("../booking-availability");
const { requestedBranch } = require("../branches");

const browseOverlap = `CASE WHEN $1::timestamp IS NULL THEN ${coversNow}
  ELSE ${overlapsPeriod('$1', '$2')} END`;

async function listCars(req, res, availableOnly = false) {
  try {
    const query = req.query || {};
    const period = query.pickup_datetime !== undefined || query.return_datetime !== undefined
      ? await bookingPeriod(pool, query)
      : null;
    if (period && !period.future) throw new BookingError(400, "Pickup must be in the future");
    const pickupBranch = requestedBranch(query.pickup_branch);
    const dropoffBranch = requestedBranch(query.dropoff_branch);
    const id = req.params.id ?? null;
    if (id !== null && (!/^[1-9]\d{0,18}$/.test(id) || BigInt(id) > 9223372036854775807n)) {
      throw new BookingError(400, "Invalid car ID");
    }
    const { rows } = await pool.query(
      `SELECT fleet.* FROM (
         SELECT c.*, ${operationalStatus} AS operational_status, ${fleetStatus(browseOverlap)} AS availability_status
         FROM cars c
         WHERE ($3::bigint IS NULL OR c.id = $3)
           AND array_remove(ARRAY[$4::text, $5::text], NULL)
             <@ regexp_split_to_array(lower(trim(coalesce(c.available_branches, ''))), '[[:space:]]*,[[:space:]]*')
       ) AS fleet
       WHERE ($6::boolean IS FALSE OR fleet.availability_status = 'available') ORDER BY fleet.id`,
      [period?.pickup ?? null, period?.dropoff ?? null, id, pickupBranch?.toLowerCase() ?? null,
        dropoffBranch?.toLowerCase() ?? null, availableOnly]
    );
    const cars = rows.map(({ status_from_booking, availability_status, ...car }) => ({ ...car, status: availability_status }));
    if (id !== null && !cars.length) return res.status(404).json({ message: "Car not found" });
    res.json(id === null ? cars : cars[0]);
  } catch (error) {
    if (error instanceof BookingError) return res.status(error.status).json({ message: error.message });
    if (['22007', '22008', '22009'].includes(error.code)) return res.status(400).json({ message: "Invalid datetime format" });
    res.status(500).json({ message: "Server error" });
  }
}

router.get("/", (req, res) => listCars(req, res));
router.get("/available", (req, res) => listCars(req, res, true));
router.get("/:id", (req, res) => listCars(req, res));

/* Admin routes for creating and updating fleet data */
const { carValues, carStatus, CarInputError } = require("../car-input");

function carWriteError(res, err) {
  if (err instanceof CarInputError) return res.status(400).json({ message: err.message });
  if (err.code === "23505") return res.status(409).json({ message: "This plate number is already in use." });
  if (err.code === "22P02" || err.code === "22003") {
    return res.status(400).json({ message: "Invalid car ID or numeric value." });
  }
  return res.status(500).json({ message: "Server error" });
}

router.post("/", auth, allowRoles("admin"), async (req, res) => {
  try {
    const values = carValues(req.body, "available");
    const result = await pool.query(
      `INSERT INTO cars (
         brand, model, production_year, category, plate_number, seats, transmission, fuel_type,
         daily_price, status, image_url, description, available_branches, technical_specifications,
         safety_features, performance_info, doors
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      values
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return carWriteError(res, err);
  }
});

router.put("/:id", auth, allowRoles("admin"), async (req, res) => {
  try {
    const values = carValues(req.body);
    const result = await pool.query(
      `UPDATE cars
       SET brand = $1, model = $2, production_year = $3, category = $4, plate_number = $5,
           seats = $6, transmission = $7, fuel_type = $8, daily_price = $9, status = $10,
           status_from_booking = FALSE, image_url = $11, description = $12,
           available_branches = CASE WHEN $19::boolean THEN available_branches ELSE $13 END,
           technical_specifications = $14, safety_features = $15, performance_info = $16, doors = $17,
           updated_at = NOW()
       WHERE id = $18 RETURNING *`,
      [...values, req.params.id, req.body?.preserve_available_branches === true]
    );
    if (!result.rows.length) return res.status(404).json({ message: "Car not found" });
    return res.json(result.rows[0]);
  } catch (err) {
    return carWriteError(res, err);
  }
});

router.patch("/:id/status", auth, allowRoles("admin", "staff"), async (req, res) => {
  try {
    const status = carStatus(req.body?.status);
    const result = await pool.query(
      `UPDATE cars SET status = $1, status_from_booking = FALSE, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: "Car not found" });
    return res.json(result.rows[0]);
  } catch (err) {
    return carWriteError(res, err);
  }
});

router.delete("/:id", auth, allowRoles("admin"), async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const car = await client.query("SELECT id FROM cars WHERE id = $1 FOR UPDATE", [id]);
    if (!car.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Car not found" });
    }

    const bookings = await client.query("SELECT 1 FROM bookings WHERE car_id = $1 LIMIT 1", [id]);
    if (bookings.rowCount) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "This car has booking history and cannot be deleted." });
    }
    const result = await client.query("DELETE FROM cars WHERE id = $1 RETURNING *", [id]);
    await client.query("COMMIT");
    res.json({ message: "Car deleted ✅", car: result.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23503") {
      return res.status(409).json({ message: "This car is linked to existing records." });
    }
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

module.exports = router;
