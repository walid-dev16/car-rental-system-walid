const express = require("express");
const cors = require("cors");
const path = require("node:path");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes.js");
const bookingsRoutes = require("./routes/bookings.routes.js");
const carsRoutes = require("./routes/cars.routes.js");
const dashboardRoutes = require("./routes/dashboard.routes.js");
const usersRoutes = require("./routes/users.routes.js");
const contactRoutes = require("./routes/contact.routes.js");
const pool = require("./db");

const app = express();

/* Global middleware configuration */
if (process.env.CORS_ORIGIN) app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

/* API route registration */
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/cars", carsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api", (req, res) => res.status(404).json({ message: "API route not found" }));

const webDirectory = process.env.FRONTEND_DIST || path.resolve(__dirname, "../frontend/dist");
app.use(express.static(webDirectory, { index: false }));
// BrowserRouter routes need the entry page when bookmarked or refreshed.
app.get("/{*path}", (req, res, next) => {
  if (path.extname(req.path) || !req.accepts("html")) return next();
  res.sendFile(path.join(webDirectory, "index.html"), (err) => {
    if (err) next();
  });
});

/* Fallback handler for undefined routes */
app.use((req, res) => {
  res.status(404).json({ message: "API Route not found" });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

function shutdown() {
  server.close(async () => {
    await pool.end();
  });
  server.closeIdleConnections();
}
process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
