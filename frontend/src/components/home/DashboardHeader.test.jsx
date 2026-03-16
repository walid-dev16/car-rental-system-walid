import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DashboardHeader from "../DashboardHeader.jsx";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../BrandLogo.jsx", () => ({
  default: () => <div>BrandLogo</div>,
}));

describe("DashboardHeader Component", () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
  });

  it("renders passed title", () => {
    localStorage.setItem(
      "user",
      JSON.stringify({
        email: "user@test.com",
        role: "customer",
      })
    );

    render(
      <MemoryRouter>
        <DashboardHeader title="Customer Dashboard" />
      </MemoryRouter>
    );

    expect(screen.getByText(/Customer Dashboard/i)).toBeInTheDocument();
  });

  it("shows customer role label", () => {
    localStorage.setItem(
      "user",
      JSON.stringify({
        email: "customer@test.com",
        role: "customer",
      })
    );

    render(
      <MemoryRouter>
        <DashboardHeader title="Dashboard" />
      </MemoryRouter>
    );

    expect(screen.getByText(/customer@test.com/i)).toBeInTheDocument();
    expect(screen.getByText(/Customer/i)).toBeInTheDocument();
  });

  it("shows admin links for admin user", () => {
    localStorage.setItem(
      "user",
      JSON.stringify({
        email: "admin@test.com",
        role: "admin",
      })
    );

    render(
      <MemoryRouter>
        <DashboardHeader title="Admin Dashboard" />
      </MemoryRouter>
    );

    expect(screen.getByText(/Admin Cars/i)).toBeInTheDocument();
    expect(screen.getByText(/Users/i)).toBeInTheDocument();
    expect(screen.getByText(/Bookings/i)).toBeInTheDocument();
  });

  it("shows browse cars and my bookings for customer", () => {
    localStorage.setItem(
      "user",
      JSON.stringify({
        email: "customer@test.com",
        role: "customer",
      })
    );

    render(
      <MemoryRouter>
        <DashboardHeader title="Customer Dashboard" />
      </MemoryRouter>
    );

    expect(screen.getByText(/Browse Cars/i)).toBeInTheDocument();
    expect(screen.getByText(/My Bookings/i)).toBeInTheDocument();
  });

  it("shows bookings link for staff", () => {
    localStorage.setItem(
      "user",
      JSON.stringify({
        email: "staff@test.com",
        role: "staff",
      })
    );

    render(
      <MemoryRouter>
        <DashboardHeader title="Staff Dashboard" />
      </MemoryRouter>
    );

    expect(screen.getByText(/Bookings/i)).toBeInTheDocument();
  });

  it("logout clears storage and redirects to login", () => {
    localStorage.setItem("token", "fake-token");
    localStorage.setItem(
      "user",
      JSON.stringify({
        email: "admin@test.com",
        role: "admin",
      })
    );

    render(
      <MemoryRouter>
        <DashboardHeader title="Admin Dashboard" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /Logout/i }));

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});