import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "./Navbar.jsx";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Navbar Component", () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
  });

  it("shows login and register when no user is logged in", () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /Login/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Register/i })).toBeInTheDocument();
  });

  it("shows common navigation links", () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/Cars/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Why Us/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Contact Us/i).length).toBeGreaterThan(0);
  });

  it("shows customer links when customer is logged in", () => {
    localStorage.setItem(
      "user",
      JSON.stringify({
        first_name: "Ahmad",
        email: "ahmad@test.com",
        role: "customer",
      })
    );

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByText(/Welcome back, Ahmad/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Home/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/My Bookings/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Dashboard/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Logout/i })).toBeInTheDocument();
  });

  it("shows admin-only links when admin is logged in", () => {
    localStorage.setItem(
      "user",
      JSON.stringify({
        first_name: "Walid",
        email: "walid@test.com",
        role: "admin",
      })
    );

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByText(/Admin Cars/i)).toBeInTheDocument();
    expect(screen.getByText(/Users/i)).toBeInTheDocument();
    expect(screen.getByText(/Bookings/i)).toBeInTheDocument();
  });

  it("logs out correctly", () => {
    localStorage.setItem("token", "fake-token");
    localStorage.setItem(
      "user",
      JSON.stringify({
        first_name: "Walid",
        email: "walid@test.com",
        role: "admin",
      })
    );

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /Logout/i }));

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});