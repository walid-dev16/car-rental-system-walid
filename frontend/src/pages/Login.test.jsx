import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "./Login.jsx";

const mockNavigate = vi.fn();
const mockLoginApi = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../api/api.js", () => ({
  login: (...args) => mockLoginApi(...args),
}));

vi.mock("../config/brand.js", () => ({
  BRAND_NAME: "AutoLuxe",
  BRAND_TAGLINE: "Premium Car Rental",
}));

describe("Login Page", () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
    mockLoginApi.mockClear();
  });

  it("renders login form fields and button", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByText(/AutoLuxe/i)).toBeInTheDocument();
    expect(screen.getByText(/Premium Car Rental/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/name@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument();
  });

  it("updates input values when typing", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/name@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);

    fireEvent.change(emailInput, { target: { name: "email", value: "user@test.com" } });
    fireEvent.change(passwordInput, { target: { name: "password", value: "123456" } });

    expect(emailInput.value).toBe("user@test.com");
    expect(passwordInput.value).toBe("123456");
  });

  it("shows expired session message from localStorage", () => {
    localStorage.setItem("session_expired_message", "Session expired. Please login again.");

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/Session expired. Please login again./i)
    ).toBeInTheDocument();

    expect(localStorage.getItem("session_expired_message")).toBeNull();
  });

  it("logs in successfully and redirects to home", async () => {
    mockLoginApi.mockResolvedValue({
      data: {
        token: "fake-token",
        user: {
          id: 1,
          role: "customer",
          email: "user@test.com",
        },
      },
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/name@example.com/i), {
      target: { name: "email", value: "user@test.com" },
    });

    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { name: "password", value: "123456" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockLoginApi).toHaveBeenCalledWith({
        email: "user@test.com",
        password: "123456",
      });
    });

    expect(localStorage.getItem("token")).toBe("fake-token");
    expect(JSON.parse(localStorage.getItem("user"))).toEqual({
      id: 1,
      role: "customer",
      email: "user@test.com",
    });

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("shows loading state while submitting", async () => {
    mockLoginApi.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: {
                  token: "fake-token",
                  user: { id: 1, role: "customer", email: "user@test.com" },
                },
              }),
            100
          )
        )
    );

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/name@example.com/i), {
      target: { name: "email", value: "user@test.com" },
    });

    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { name: "password", value: "123456" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

    expect(screen.getByRole("button")).toHaveTextContent(/Processing.../i);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("shows error message when login fails", async () => {
    mockLoginApi.mockRejectedValue({
      response: {
        data: {
          message: "Invalid credentials",
        },
      },
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/name@example.com/i), {
      target: { name: "email", value: "wrong@test.com" },
    });

    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { name: "password", value: "wrongpass" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
  });
});