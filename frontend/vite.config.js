import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.js",
    coverage: {
  provider: "v8",
  reporter: ["text", "html"],
  reportsDirectory: "./coverage",
  include: ["src/**/*.{js,jsx}"],
  exclude: [
    "src/main.jsx",
    "src/api/api.js",
    "src/pages/AdminCars.jsx",
    "src/pages/BookingPage.jsx",
    "src/pages/BookingsPage.jsx",
    "src/pages/CarDetailsPage.jsx",
    "src/pages/CarsPage.jsx",
    "src/pages/CustomerDashboard.jsx",
    "src/pages/StaffDashboard.jsx",
    "src/pages/UsersPage.jsx",
    "src/components/home/HeroSection.jsx",
    "src/components/home/TimePicker.jsx",
    "src/components/home/LuxuryShowcase.jsx",
  ],
},
  },
});