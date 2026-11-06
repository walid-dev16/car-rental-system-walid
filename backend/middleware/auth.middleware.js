const jwt = require("jsonwebtoken");
const pool = require("../db");

const roles = new Set(["customer", "staff", "admin"]);
const enabledStatuses = new Set(["pending", "active", "approved"]);

// PostgreSQL BIGINT ids arrive as strings. Do not round them through Number.
function isValidUserId(id) {
  if (typeof id === "number") return Number.isSafeInteger(id) && id > 0;
  return typeof id === "string" && /^[1-9]\d{0,18}$/.test(id)
    && BigInt(id) <= 9223372036854775807n;
}

function isEnabledUser(user) {
  return Boolean(user && isValidUserId(user.id)
    && roles.has(user.role) && enabledStatuses.has(user.account_status));
}

async function authenticate(req, res, next) {
  const authorization = req.headers.authorization;
  const match = typeof authorization === "string" && authorization.length <= 4096
    ? /^Bearer ([^\s]+)$/i.exec(authorization) : null;
  if (!match) return res.status(401).json({ message: "Not authorized" });

  let decoded;
  try {
    decoded = jwt.verify(match[1], process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (!decoded || typeof decoded !== "object" || !isValidUserId(decoded.id)) {
      return res.status(401).json({ message: "Invalid token" });
    }
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }

  let user;
  try {
    const result = await pool.query(
      "SELECT id, role, account_status FROM users WHERE id = $1", [decoded.id]
    );
    user = result.rows[0];
  } catch {
    return res.status(503).json({ message: "Service temporarily unavailable" });
  }

  if (!isEnabledUser(user)) return res.status(401).json({ message: "Not authorized" });
  // Authorization always uses the current database role, never the JWT role.
  req.user = { id: user.id, role: user.role };
  return next();
}

module.exports = authenticate;
module.exports.isValidUserId = isValidUserId;
module.exports.isEnabledUser = isEnabledUser;
