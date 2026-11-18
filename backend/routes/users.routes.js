const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const enabledStatuses = require("../account-status");

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
    res.status(500).json({ message: "Failed to load users" });
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
    res.status(500).json({ message: "Failed to update profile" });
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user
 * @access  Protected (Admin only)
 */
router.delete("/:id", auth, allowRoles("admin"), async (req, res) => {
  const { id } = req.params;
  if (!/^\d{1,19}$/.test(id) || BigInt(id) > 9223372036854775807n) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    // Lock administrators in the same order so simultaneous deletes retain an active administrator.
    const { rows } = await client.query(
      `SELECT id, id = $1 AS target,
              (role = 'admin' AND LOWER(TRIM(account_status)) = ANY($2::text[])) AS active_admin
       FROM users WHERE id = $1 OR role = 'admin'
       ORDER BY id FOR UPDATE`,
      [id, enabledStatuses]
    );
    const admins = rows.filter((row) => row.active_admin);
    if (!admins.some((row) => String(row.id) === String(req.user.id))) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Administrator access required" });
    }
    const target = rows.find((row) => row.target);
    if (!target) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "User not found" });
    }
    if (target.active_admin && admins.length === 1) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "At least one active administrator is required" });
    }
    const bookings = await client.query("SELECT 1 FROM bookings WHERE user_id = $1 LIMIT 1", [id]);
    if (bookings.rowCount) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Users with booking history cannot be deleted" });
    }
    await client.query("DELETE FROM users WHERE id = $1", [id]);
    await client.query("COMMIT");
    return res.json({ message: "User deleted successfully", user: { id: target.id } });
  } catch (err) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch {
        client.release(true);
        client = null;
      }
    }
    if (err.code === "23503") {
      return res.status(409).json({ message: "User is still referenced by other records" });
    }
    return res.status(500).json({ message: "Failed to delete user" });
  } finally {
    client?.release();
  }
});

module.exports = router;
