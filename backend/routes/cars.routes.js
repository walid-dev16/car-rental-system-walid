const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const router = express.Router();

/* Public routes for browsing cars */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM cars ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/available", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM cars WHERE status = 'available' ORDER BY id"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("SELECT * FROM cars WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Car not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* Admin routes for creating and updating fleet data */
router.post("/", auth, allowRoles("admin"), async (req, res) => {
  try {
    const {
      brand,
      model,
      production_year,
      category,
      plate_number,
      seats,
      transmission,
      fuel_type,
      daily_price,
      status,
      image_url,
      description,
      available_branches,
      technical_specifications,
      safety_features,
      performance_info,
      doors,
    } = req.body;

    if (
      !brand ||
      !model ||
      !production_year ||
      !category ||
      !plate_number ||
      !seats ||
      !transmission ||
      !fuel_type ||
      !daily_price
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const result = await pool.query(
      `INSERT INTO cars
      (
        brand,
        model,
        production_year,
        category,
        plate_number,
        seats,
        transmission,
        fuel_type,
        daily_price,
        status,
        image_url,
        description,
        available_branches,
        technical_specifications,
        safety_features,
        performance_info,
        doors
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *`,
      [
        brand,
        model,
        production_year,
        category,
        plate_number,
        seats,
        transmission,
        fuel_type,
        daily_price,
        status || "available",
        image_url || null,
        description || null,
        available_branches || null,
        technical_specifications || null,
        safety_features || null,
        performance_info || null,
        doors || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", auth, allowRoles("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      brand,
      model,
      production_year,
      category,
      plate_number,
      seats,
      transmission,
      fuel_type,
      daily_price,
      status,
      image_url,
      description,
      available_branches,
      technical_specifications,
      safety_features,
      performance_info,
      doors,
    } = req.body;

    if (
      !brand ||
      !model ||
      !production_year ||
      !category ||
      !plate_number ||
      !seats ||
      !transmission ||
      !fuel_type ||
      !daily_price ||
      !status
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const result = await pool.query(
      `UPDATE cars
       SET brand = $1,
           model = $2,
           production_year = $3,
           category = $4,
           plate_number = $5,
           seats = $6,
           transmission = $7,
           fuel_type = $8,
           daily_price = $9,
           status = $10,
           image_url = $11,
           description = $12,
           available_branches = $13,
           technical_specifications = $14,
           safety_features = $15,
           performance_info = $16,
           doors = $17,
           updated_at = NOW()
       WHERE id = $18
       RETURNING *`,
      [
        brand,
        model,
        production_year,
        category,
        plate_number,
        seats,
        transmission,
        fuel_type,
        daily_price,
        status,
        image_url || null,
        description || null,
        available_branches || null,
        technical_specifications || null,
        safety_features || null,
        performance_info || null,
        doors || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Car not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* Partial update route for car availability status */
router.patch("/:id/status", auth, allowRoles("admin", "staff"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["available", "booked", "maintenance"];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Allowed: ${allowed.join(", ")}`,
      });
    }

    const result = await pool.query(
      "UPDATE cars SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *",
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Car not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", auth, allowRoles("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM cars WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Car not found" });
    }

    res.json({ message: "Car deleted ✅", car: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;