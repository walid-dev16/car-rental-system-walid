const WINDOW_MS = 15 * 60 * 1000;
const MAX_KEYS = 10000;

// Each process keeps bounded, fixed-window counters in expiration order.
module.exports = function limitAttempts(limit, getKey) {
  const attempts = new Map();

  return (req, res, next) => {
    const key = getKey(req);
    if (!key) return next();

    const now = Date.now();
    for (const [oldKey, entry] of attempts) {
      if (entry.expires > now) break;
      attempts.delete(oldKey);
    }

    let entry = attempts.get(key);
    if (!entry && attempts.size < MAX_KEYS) {
      entry = { count: 0, expires: now + WINDOW_MS };
      attempts.set(key, entry);
    }

    if (!entry || entry.count >= limit) {
      const expires = entry?.expires ?? attempts.values().next().value.expires;
      res.set("Retry-After", String(Math.ceil((expires - now) / 1000)));
      return res.status(429).json({ message: "Too many attempts. Please try again later." });
    }

    entry.count += 1;
    return next();
  };
};
