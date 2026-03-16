import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("./pages/HomePage.jsx", () => ({
  default: () => <div>Home Page</div>,
}));

vi.mock("./pages/Login.jsx", () => ({
  default: () => <div>Login Page</div>,
}));

vi.mock("./pages/Register.jsx", () => ({
  default: () => <div>Register Page</div>,
}));

vi.mock("./pages/AdminDashboard.jsx", () => ({
  default: () => <div>Admin Dashboard</div>,
}));

vi.mock("./pages/AdminCars.jsx", () => ({
  default: () => <div>Admin Cars Page</div>,
}));

vi.mock("./pages/StaffDashboard.jsx", () => ({
  default: () => <div>Staff Dashboard</div>,
}));

vi.mock("./pages/CustomerDashboard.jsx", () => ({
  default: () => <div>Customer Dashboard</div>,
}));

vi.mock("./pages/CarsPage.jsx", () => ({
  default: () => <div>Cars Page</div>,
}));

vi.mock("./pages/CarDetailsPage.jsx", () => ({
  default: () => <div>Car Details Page</div>,
}));

vi.mock("./pages/BookingsPage.jsx", () => ({
  default: () => <div>Bookings Page</div>,
}));

vi.mock("./pages/UsersPage.jsx", () => ({
  default: () => <div>Users Page</div>,
}));

vi.mock("./pages/ContactPage.jsx", () => ({
  default: () => <div>Contact Page</div>,
}));

vi.mock("./pages/WhyUsPage.jsx", () => ({
  default: () => <div>Why Us Page</div>,
}));

vi.mock("./pages/BookingPage.jsx", () => ({
  default: () => <div>Booking Page</div>,
}));

vi.mock("./pages/MyBookingsPage.jsx", () => ({
  default: () => <div>My Bookings Page</div>,
}));

import { MemoryRouter } from "react-router-dom";
import App from "./App.jsx";

function renderAppAt(route) {
  window.history.pushState({}, "", route);
  return render(<App />);
}

describe("App Routing", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, "", "/");
  });

  it("renders home page on /", () => {
    renderAppAt("/");
    expect(screen.getByText(/Home Page/i)).toBeInTheDocument();
  });

  it("renders login page on /login", () => {
    renderAppAt("/login");
    expect(screen.getByText(/Login Page/i)).toBeInTheDocument();
  });

  it("renders register page on /register", () => {
    renderAppAt("/register");
    expect(screen.getByText(/Register Page/i)).toBeInTheDocument();
  });

  it("renders cars page on /cars", () => {
    renderAppAt("/cars");
    expect(screen.getByText(/Cars Page/i)).toBeInTheDocument();
  });

  it("renders contact page on /contact", () => {
    renderAppAt("/contact");
    expect(screen.getByText(/Contact Page/i)).toBeInTheDocument();
  });

  it("renders why us page on /why-us", () => {
    renderAppAt("/why-us");
    expect(screen.getByText(/Why Us Page/i)).toBeInTheDocument();
  });

  it("redirects protected admin route to login when not authenticated", () => {
    renderAppAt("/admin-dashboard");
    expect(screen.getByText(/Login Page/i)).toBeInTheDocument();
  });

  it("renders admin dashboard when admin is authenticated", () => {
    localStorage.setItem("token", "fake-token");
    localStorage.setItem("user", JSON.stringify({ role: "admin" }));

    renderAppAt("/admin-dashboard");
    expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument();
  });

  it("renders staff dashboard when staff is authenticated", () => {
    localStorage.setItem("token", "fake-token");
    localStorage.setItem("user", JSON.stringify({ role: "staff" }));

    renderAppAt("/staff-dashboard");
    expect(screen.getByText(/Staff Dashboard/i)).toBeInTheDocument();
  });

  it("renders customer dashboard when customer is authenticated", () => {
    localStorage.setItem("token", "fake-token");
    localStorage.setItem("user", JSON.stringify({ role: "customer" }));

    renderAppAt("/customer-dashboard");
    expect(screen.getByText(/Customer Dashboard/i)).toBeInTheDocument();
  });

  it("renders bookings page for admin", () => {
    localStorage.setItem("token", "fake-token");
    localStorage.setItem("user", JSON.stringify({ role: "admin" }));

    renderAppAt("/bookings");
    expect(screen.getByText(/Bookings Page/i)).toBeInTheDocument();
  });

  it("renders users page for admin", () => {
    localStorage.setItem("token", "fake-token");
    localStorage.setItem("user", JSON.stringify({ role: "admin" }));

    renderAppAt("/users");
    expect(screen.getByText(/Users Page/i)).toBeInTheDocument();
  });

  it("renders booking page for customer", () => {
    localStorage.setItem("token", "fake-token");
    localStorage.setItem("user", JSON.stringify({ role: "customer" }));

    renderAppAt("/booking/1");
    expect(screen.getByText(/Booking Page/i)).toBeInTheDocument();
  });

  it("renders my bookings page for customer", () => {
    localStorage.setItem("token", "fake-token");
    localStorage.setItem("user", JSON.stringify({ role: "customer" }));

    renderAppAt("/my-bookings");
    expect(screen.getByText(/My Bookings Page/i)).toBeInTheDocument();
  });

  it("redirects unknown route to home", () => {
    renderAppAt("/some-random-route");
    expect(screen.getByText(/Home Page/i)).toBeInTheDocument();
  });
});