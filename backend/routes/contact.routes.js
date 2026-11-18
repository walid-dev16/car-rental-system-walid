const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const limitAttempts = require("../middleware/auth-rate-limit");

const router = express.Router();
router.post("/", limitAttempts(8, (req) => req.ip), async (req, res) => {
  const fields = ["sender_name", "email", "subject", "message"].map((key) =>
    typeof req.body?.[key] === "string" ? req.body[key].trim() : ""
  );
  const limits = [100, 254, 150, 4000];
  if (fields.some((value, index) => !value || value.length > limits[index]) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields[1])) {
    return res.status(400).json({ message: "Check your name, email address, subject and message." });
  }
  try {
    await pool.query("INSERT INTO contact_messages (sender_name, email, subject, message) VALUES ($1,$2,$3,$4)", fields);
    return res.status(201).json({ message: "Your message was received by the rental office." });
  } catch {
    return res.status(503).json({ message: "We could not save your message. Please try again." });
  }
});

router.get("/", auth, allowRoles("admin", "staff"), async (req, res) => {
  const { before } = req.query;
  if (before !== undefined && (typeof before !== "string" || !/^[1-9]\d{0,18}$/.test(before) || BigInt(before) > 9223372036854775807n)) {
    return res.status(400).json({ message: "Invalid message cursor" });
  }
  try {
    const result = await pool.query(
      "SELECT id, sender_name, email, subject, message, created_at FROM contact_messages WHERE ($1::bigint IS NULL OR id < $1) ORDER BY id DESC LIMIT 51",
      [before ?? null]
    );
    const messages = result.rows.slice(0, 50);
    return res.json({ messages, next: result.rows.length > 50 ? messages.at(-1).id : null });
  } catch {
    return res.status(503).json({ message: "Unable to load messages." });
  }
});

module.exports = router;
