import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./pages/HomePage.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminCars from "./pages/AdminCars.jsx";
import StaffDashboard from "./pages/StaffDashboard.jsx";
import CustomerDashboard from "./pages/CustomerDashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import CarsPage from "./pages/CarsPage.jsx";
import CarDetailsPage from "./pages/CarDetailsPage.jsx";
import BookingsPage from "./pages/BookingsPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import WhyUsPage from "./pages/WhyUsPage.jsx";
import BookingPage from "./pages/BookingPage.jsx";
import MyBookingsPage from "./pages/MyBookingsPage.jsx";

function App() {
  return (
    <Router>
      <div className="bg-[#ff5f00] px-4 py-2 text-center text-sm font-semibold text-white">
        Educational demo — use fictional details. No real rental or payment is processed.
      </div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/cars" element={<CarsPage />} />
        <Route path="/cars/:id" element={<CarDetailsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/why-us" element={<WhyUsPage />} />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-cars"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminCars />
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff-dashboard"
          element={
            <ProtectedRoute allowedRoles={["staff", "admin"]}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer-dashboard"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bookings"
          element={
            <ProtectedRoute allowedRoles={["admin", "staff"]}>
              <BookingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/booking/:carId"
          element={
            <ProtectedRoute allowedRoles={["customer", "admin", "staff"]}>
              <BookingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <MyBookingsPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
