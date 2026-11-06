const express = require("express");
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { isEnabledUser } = require("../middleware/auth.middleware");
const { createAuthLimiters } = require("../middleware/auth-limits");

const router = express.Router();
const limits = createAuthLimiters();
// Comparing a fixed valid hash also gives unknown accounts a bcrypt operation.
const dummyHash = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.3Aq7zPtMDoBn12t0J4jRlKT76.JnmL6";

function bodyObject(body) {
  return body && typeof body === "object" && !Array.isArray(body);
}

function normalizeEmail(email) {
  if (typeof email !== "string") return null;
  const normalized = email.trim().toLowerCase();
  return normalized.length <= 100 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(normalized)
    ? normalized : null;
}

function validName(value) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 50;
}

function validPassword(password, minimum) {
  return typeof password === "string" && password.trim().length > 0
    && Buffer.byteLength(password, "utf8") <= 72 && Array.from(password).length >= minimum;
}

router.post("/register", limits.register, async (req, res) => {
  if (!bodyObject(req.body)) return res.status(400).json({ message: "Invalid registration details" });
  const { first_name, last_name, password } = req.body;
  const email = normalizeEmail(req.body.email);
  if (!validName(first_name) || !validName(last_name) || !email || !validPassword(password, 12)) {
    return res.status(400).json({ message: "Provide names, a valid email, and a password of at least 12 characters (maximum 72 UTF-8 bytes)" });
  }
  try {
    const exist = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (exist.rows.length) return res.status(409).json({ message: "Email already exists" });
    const password_hash = await bcrypt.hash(password, 12);
    // Role and account status come only from database defaults.
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash)
       VALUES ($1,$2,$3,$4)
       RETURNING id, first_name, last_name, email, role`,
      [first_name.trim(), last_name.trim(), email, password_hash]
    );
    return res.status(201).json({ message: "User registered", user: result.rows[0] });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ message: "Email already exists" });
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", limits.login, async (req, res) => {
  if (!bodyObject(req.body)) return res.status(400).json({ message: "Invalid login details" });
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;
  // Existing shorter passwords remain usable; all passwords respect bcrypt's byte limit.
  if (!email || !validPassword(password, 1)) return res.status(400).json({ message: "Invalid login details" });
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, password_hash, role, account_status
       FROM users WHERE email = $1`, [email]
    );
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user?.password_hash || dummyHash);
    if (!isMatch || !isEnabledUser(user)) return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign(
      { id: user.id, role: user.role }, process.env.JWT_SECRET,
      { algorithm: "HS256", expiresIn: "1h" }
    );
    return res.json({
      token,
      user: {
        id: user.id, first_name: user.first_name, last_name: user.last_name,
        email: user.email, role: user.role,
      },
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
