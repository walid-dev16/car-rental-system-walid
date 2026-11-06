const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const { isProduction, trustProxy, frontendDist } = require("./config");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", trustProxy);

app.use((req, res, next) => {
  res.set({
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https: data: blob:",
      "font-src 'self' data: https:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "X-DNS-Prefetch-Control": "off",
  });
  if (isProduction) {
    res.set("Strict-Transport-Security", "max-age=31536000");
  }
  next();
});

app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.use(express.json({ limit: "32kb" }));

// Minimal process liveness response for the hosting health check.
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/bookings", require("./routes/bookings.routes"));
app.use("/api/cars", require("./routes/cars.routes"));
app.use("/api/dashboard", require("./routes/dashboard.routes"));
app.use("/api/users", require("./routes/users.routes"));
app.use("/api", (req, res) => res.status(404).json({ message: "API route not found" }));

const frontendIndex = path.join(frontendDist, "index.html");
const hasFrontend = fs.existsSync(frontendIndex);
if (isProduction && !hasFrontend) {
  throw new Error("Production frontend is missing. Build frontend before starting the server");
}

if (hasFrontend) {
  app.use(express.static(frontendDist, {
    dotfiles: "deny",
    index: false,
    maxAge: "1h",
    setHeaders(res, filename) {
      if (filename.startsWith(path.join(frontendDist, "assets") + path.sep)) {
        res.set("Cache-Control", "public, max-age=31536000, immutable");
      } else if (filename === frontendIndex) {
        res.set("Cache-Control", "no-cache");
      }
    },
  }));

  // A middleware fallback avoids the Express 5 wildcard route syntax. Only
  // browser HTML navigation receives the SPA shell, never missing assets/API.
  app.use((req, res, next) => {
    const wantsHtml = /\btext\/html\b/i.test(req.get("accept") || "") && req.accepts("html");
    if (
      req.method !== "GET" ||
      !wantsHtml ||
      path.extname(req.path) ||
      /(?:^|\/)\./.test(req.path) ||
      /^\/assets(?:\/|$)/i.test(req.path)
    ) {
      return next();
    }
    res.set("Cache-Control", "no-cache");
    return res.sendFile(frontendIndex);
  });
}

app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.type === "entity.too.large" ? 413
    : err.type === "entity.parse.failed" ? 400
    : 500;
  if (status === 500) console.error("Unhandled request error");
  return res.status(status).json({
    message: status === 413 ? "Request body too large"
      : status === 400 ? "Invalid JSON body"
      : "Server error",
  });
});

module.exports = app;
