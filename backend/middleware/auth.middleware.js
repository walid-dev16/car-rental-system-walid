const jwt = require("jsonwebtoken");
const pool = require("../db");
const enabledStatuses = require("../account-status");
const readRuntimeSecret = require("../runtime-secret");

const jwtSecret = readRuntimeSecret("JWT_SECRET");

module.exports = async function (req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized" });
  }

  let decoded;
  try {
    decoded = jwt.verify(authHeader.slice(7), jwtSecret, { algorithms: ["HS256"] });
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
  if (!decoded || !/^\d{1,19}$/.test(decoded.id) || BigInt(decoded.id) > 9223372036854775807n) {
    return res.status(401).json({ message: "Invalid token" });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, role FROM users
       WHERE id = $1 AND LOWER(TRIM(account_status)) = ANY($2::text[])`,
      [decoded.id, enabledStatuses]
    );
    if (!rows.length) return res.status(401).json({ message: "Session no longer active" });
    req.user = rows[0];
  } catch {
    return res.status(503).json({ message: "Authentication is temporarily unavailable" });
  }

  return next();
};
