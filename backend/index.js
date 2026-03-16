const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes.js");
const bookingsRoutes = require("./routes/bookings.routes.js");
const carsRoutes = require("./routes/cars.routes.js");
const dashboardRoutes = require("./routes/dashboard.routes.js");
const usersRoutes = require("./routes/users.routes.js");

const app = express();

/* Global middleware configuration */
app.use(cors());
app.use(express.json());

/* API route registration */
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/cars", carsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", usersRoutes);

/* Fallback handler for undefined routes */
app.use((req, res) => {
  res.status(404).json({ message: "API Route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});