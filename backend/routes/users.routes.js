const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Get all users with booking count
 * @access  Protected (Admin only)
 */
router.get("/", auth, allowRoles("admin"), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.role,
        u.account_status,
        u.street_address,
        u.city,
        u.postal_code,
        u.country_code,
        u.created_at,
        COUNT(b.id) AS total_bookings
      FROM users u
      LEFT JOIN bookings b ON b.user_id = u.id
      GROUP BY
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.role,
        u.account_status,
        u.street_address,
        u.city,
        u.postal_code,
        u.country_code,
        u.created_at
      ORDER BY u.id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("USERS LIST ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile details
 * @access  Protected (Any logged-in user)
 */
router.put("/profile", auth, async (req, res) => {
  try {
    const { phone, street_address, city, postal_code } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET phone = $1,
           street_address = $2,
           city = $3,
           postal_code = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING
         id,
         first_name,
         last_name,
         email,
         phone,
         role,
         account_status,
         street_address,
         city,
         postal_code,
         country_code,
         created_at,
         updated_at`,
      [
        phone || null,
        street_address || null,
        city || null,
        postal_code || null,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully ✅",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("PROFILE UPDATE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user
 * @access  Protected (Admin only)
 */
router.delete("/:id", auth, allowRoles("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User deleted successfully ✅",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("USER DELETE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;