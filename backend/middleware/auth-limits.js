const { createHash } = require("node:crypto");
const { isIP } = require("node:net");

// Fixed windows with insertion-ordered expiry keep both memory and cleanup
// bounded. A full cache denies new keys until capacity is available.
function createAttemptCounter({ limit, windowMs, maxEntries = 10000, clock = Date.now }) {
  if (![limit, windowMs, maxEntries].every(Number.isSafeInteger)
      || limit < 1 || windowMs < 1 || maxEntries < 1 || typeof clock !== "function") {
    throw new TypeError("Invalid attempt counter settings");
  }
  const entries = new Map();
  let previousNow = 0;
  return {
    consume(key) {
      const now = Math.max(previousNow, clock());
      previousNow = now;
      for (const [storedKey, entry] of entries) {
        if (entry.expiresAt > now) break;
        entries.delete(storedKey);
      }
      let entry = entries.get(key);
      if (!entry && entries.size >= maxEntries) {
        const earliestExpiry = entries.values().next().value.expiresAt;
        return { allowed: false, retryAfter: Math.max(1, Math.ceil((earliestExpiry - now) / 1000)) };
      }
      if (!entry) {
        entry = { attempts: 0, expiresAt: now + windowMs };
        entries.set(key, entry);
      }
      const retryAfter = Math.max(1, Math.ceil((entry.expiresAt - now) / 1000));
      if (entry.attempts >= limit) return { allowed: false, retryAfter };
      entry.attempts += 1;
      return { allowed: true, retryAfter };
    },
    get size() { return entries.size; },
  };
}

function normalizeIp(raw) {
  if (typeof raw !== "string" || raw.length > 128) return "unknown";
  const address = raw.toLowerCase().split("%")[0];
  if (isIP(address) === 4) return address;
  if (isIP(address) !== 6) return "unknown";
  const expandedV4 = address.replace(/(\d+\.\d+\.\d+\.\d+)$/, (value) => {
    const octets = value.split(".").map(Number);
    return ((octets[0] << 8) | octets[1]).toString(16) + ":"
      + ((octets[2] << 8) | octets[3]).toString(16);
  });
  const halves = expandedV4.split("::");
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves.length > 1 && halves[1] ? halves[1].split(":") : [];
  const words = halves.length > 1
    ? [...left, ...Array(8 - left.length - right.length).fill("0"), ...right]
    : left;
  const numbers = words.map((word) => parseInt(word, 16));
  if (numbers.slice(0, 5).every((word) => word === 0) && numbers[5] === 65535) {
    return [numbers[6] >> 8, numbers[6] & 255, numbers[7] >> 8, numbers[7] & 255].join(".");
  }
  // A client cannot obtain a fresh allowance by rotating IPv6 addresses in /64.
  return numbers.slice(0, 4).map((word) => word.toString(16).padStart(4, "0")).join(":") + "::/64";
}

function accountKey(email) {
  const value = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalized = value.length <= 100 ? value : "<invalid-account>";
  return createHash("sha256").update(normalized).digest("hex");
}

function createAuthLimiters({
  loginIpLimit = 20, loginAccountLimit = 10, loginWindowMs = 15 * 60 * 1000,
  registerIpLimit = 5, registerWindowMs = 60 * 60 * 1000,
  maxEntries = 10000, clock = Date.now,
} = {}) {
  const loginIps = createAttemptCounter({ limit: loginIpLimit, windowMs: loginWindowMs, maxEntries, clock });
  const loginAccounts = createAttemptCounter({ limit: loginAccountLimit, windowMs: loginWindowMs, maxEntries, clock });
  const registerIps = createAttemptCounter({ limit: registerIpLimit, windowMs: registerWindowMs, maxEntries, clock });
  function deny(res, result) {
    return res.set("Retry-After", String(result.retryAfter)).status(429)
      .json({ message: "Too many attempts. Please try again later." });
  }
  return {
    login(req, res, next) {
      const ip = loginIps.consume(normalizeIp(req.ip || req.socket?.remoteAddress));
      if (!ip.allowed) return deny(res, ip);
      const account = loginAccounts.consume(accountKey(req.body?.email));
      if (!account.allowed) return deny(res, account);
      return next();
    },
    register(req, res, next) {
      const result = registerIps.consume(normalizeIp(req.ip || req.socket?.remoteAddress));
      return result.allowed ? next() : deny(res, result);
    },
  };
}

module.exports = { createAttemptCounter, createAuthLimiters, normalizeIp };
