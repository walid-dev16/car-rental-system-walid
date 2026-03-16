import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute.jsx";

function renderProtectedRoute(allowedRoles = ["admin"]) {
  return render(
    <MemoryRouter initialEntries={["/protected"]}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute allowedRoles={allowedRoles}>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute Component", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("redirects to login when token is missing", () => {
    localStorage.setItem(
      "user",
      JSON.stringify({
        role: "admin",
      })
    );

    renderProtectedRoute(["admin"]);

    expect(screen.getByText(/Login Page/i)).toBeInTheDocument();
  });

  it("redirects to login when user is missing", () => {
    localStorage.setItem("token", "fake-token");

    renderProtectedRoute(["admin"]);

    expect(screen.getByText(/Login Page/i)).toBeInTheDocument();
  });

  it("redirects to login when role is not allowed", () => {
    localStorage.setItem("token", "fake-token");
    localStorage.setItem(
      "user",
      JSON.stringify({
        role: "customer",
      })
    );

    renderProtectedRoute(["admin"]);

    expect(screen.getByText(/Login Page/i)).toBeInTheDocument();
  });

  it("renders children when role is allowed", () => {
    localStorage.setItem("token", "fake-token");
    localStorage.setItem(
      "user",
      JSON.stringify({
        role: "admin",
      })
    );

    renderProtectedRoute(["admin"]);

    expect(screen.getByText(/Protected Content/i)).toBeInTheDocument();
  });

  it("matches roles case-insensitively", () => {
    localStorage.setItem("token", "fake-token");
    localStorage.setItem(
      "user",
      JSON.stringify({
        role: "Admin",
      })
    );

    renderProtectedRoute(["admin"]);

    expect(screen.getByText(/Protected Content/i)).toBeInTheDocument();
  });
});