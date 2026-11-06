import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Register from "./Register.jsx";
import { BRAND_NAME } from "../config/brand.js";

const mockNavigate = vi.fn();
const mockRegisterApi = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../api/api.js", () => ({
  register: (...args) => mockRegisterApi(...args),
}));

describe("Register Page", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockRegisterApi.mockClear();
    vi.useRealTimers();
  });

  it("renders register form fields and button", () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    expect(screen.getByText(/Create Account/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Join ${BRAND_NAME}`, "i"))).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your first name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your last name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/name@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/At least 12 characters/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Register/i })).toBeInTheDocument();
  });

  it("updates input values when typing", () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const firstNameInput = screen.getByPlaceholderText(/Enter your first name/i);
    const lastNameInput = screen.getByPlaceholderText(/Enter your last name/i);
    const emailInput = screen.getByPlaceholderText(/name@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/At least 12 characters/i);

    fireEvent.change(firstNameInput, {
      target: { name: "first_name", value: "Walid" },
    });
    fireEvent.change(lastNameInput, {
      target: { name: "last_name", value: "Rafiq" },
    });
    fireEvent.change(emailInput, {
      target: { name: "email", value: "walid@test.com" },
    });
    fireEvent.change(passwordInput, {
      target: { name: "password", value: "ValidPassword123!" },
    });

    expect(firstNameInput.value).toBe("Walid");
    expect(lastNameInput.value).toBe("Rafiq");
    expect(emailInput.value).toBe("walid@test.com");
    expect(passwordInput.value).toBe("ValidPassword123!");
  });

  it("shows loading state while submitting", async () => {
    mockRegisterApi.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: {} }), 100)
        )
    );

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter your first name/i), {
      target: { name: "first_name", value: "Walid" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter your last name/i), {
      target: { name: "last_name", value: "Rafiq" },
    });
    fireEvent.change(screen.getByPlaceholderText(/name@example.com/i), {
      target: { name: "email", value: "walid@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/At least 12 characters/i), {
      target: { name: "password", value: "ValidPassword123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Register/i }));

    expect(screen.getByRole("button")).toHaveTextContent(/Creating account.../i);

    await waitFor(() => {
      expect(mockRegisterApi).toHaveBeenCalled();
    });
  });

  it("registers successfully and shows success message", async () => {
    mockRegisterApi.mockResolvedValue({ data: {} });

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter your first name/i), {
      target: { name: "first_name", value: "Walid" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter your last name/i), {
      target: { name: "last_name", value: "Rafiq" },
    });
    fireEvent.change(screen.getByPlaceholderText(/name@example.com/i), {
      target: { name: "email", value: "walid@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/At least 12 characters/i), {
      target: { name: "password", value: "ValidPassword123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Register/i }));

    expect(mockRegisterApi).toHaveBeenCalledWith({
      first_name: "Walid",
      last_name: "Rafiq",
      email: "walid@test.com",
      password: "ValidPassword123!",
    });

    expect(
      await screen.findByText(/Account created successfully. Redirecting to login.../i)
    ).toBeInTheDocument();
  });

  it("shows error message when registration fails", async () => {
    mockRegisterApi.mockRejectedValue({
      response: {
        data: {
          message: "Email already exists",
        },
      },
    });

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter your first name/i), {
      target: { name: "first_name", value: "Walid" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter your last name/i), {
      target: { name: "last_name", value: "Rafiq" },
    });
    fireEvent.change(screen.getByPlaceholderText(/name@example.com/i), {
      target: { name: "email", value: "walid@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/At least 12 characters/i), {
      target: { name: "password", value: "ValidPassword123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Register/i }));

    await waitFor(() => {
      expect(screen.getByText(/Email already exists/i)).toBeInTheDocument();
    });
  });
});
