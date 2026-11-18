const express = require("express");
const { randomBytes } = require("node:crypto");
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const enabledStatuses = require("../account-status");
const limitAttempts = require("../middleware/auth-rate-limit");
const readRuntimeSecret = require("../runtime-secret");

const jwtSecret = readRuntimeSecret("JWT_SECRET");
const dummyHash = bcrypt.hashSync(randomBytes(32).toString("hex"), 10);
const router = express.Router();
const sourceKey = (req) => req.ip || "local-socket";
const accountKey = (req) => {
  const email = req.body?.email;
  if (typeof email !== "string") return;
  const normalized = email.trim().toLowerCase();
  if (normalized.length <= 200) return normalized;
};

router.post("/register", limitAttempts(8, sourceKey), async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body ?? {};
    const fields = [first_name, last_name, email, password];
    if (!fields.every((value) => typeof value === "string" && value.trim())) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (Array.from(normalizedEmail).length > 100 || !/^[^\s@]+@[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }
    if ([first_name, last_name].some((name) => Array.from(name.trim()).length > 50)) {
      return res.status(400).json({ message: "Names must be 50 characters or fewer" });
    }
    if (Buffer.byteLength(password, "utf8") > 72 || Array.from(password).length < 12) {
      return res.status(400).json({ message: "Use at least 12 characters and at most 72 UTF-8 bytes for your password" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [first_name.trim(), last_name.trim(), normalizedEmail, passwordHash]
    );

    return res.status(201).json({ message: "Registration request received. You can now try signing in." });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", limitAttempts(60, sourceKey), limitAttempts(15, accountKey), async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Try the original login spelling first for legacy accounts with surrounding spaces.
    const lookupEmail = email.toLowerCase();
    const { rows } = await pool.query(
      `SELECT id, first_name, last_name, email, role, password_hash,
              phone, street_address, city, postal_code FROM users
       WHERE email IN ($1, $2) AND LOWER(TRIM(account_status)) = ANY($3::text[])
       ORDER BY (email = $1) DESC LIMIT 1`,
      [lookupEmail, lookupEmail.trim(), enabledStatuses]
    );

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user?.password_hash ?? dummyHash);
    if (!user || !isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, {
      algorithm: "HS256",
      expiresIn: "1h",
    });
    return res.json({
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        street_address: user.street_address,
        city: user.city,
        postal_code: user.postal_code,
      },
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
