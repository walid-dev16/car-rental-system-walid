import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Register from "./Register.jsx";

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

    expect(screen.getByRole("heading", { level: 2, name: "Create Account" })).toBeInTheDocument();
    expect(screen.getByText("Join AutoLuxe - Premium Car Rental")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your first name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your last name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/name@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toHaveAttribute("minlength", "12");
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
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);

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
      target: { name: "password", value: "sample-passphrase" },
    });

    expect(firstNameInput.value).toBe("Walid");
    expect(lastNameInput.value).toBe("Rafiq");
    expect(emailInput.value).toBe("walid@test.com");
    expect(passwordInput.value).toBe("sample-passphrase");
  });

  it("toggles the visibility of each field independently", () => {
    render(<MemoryRouter><Register /></MemoryRouter>);
    const password = screen.getByLabelText("Password");
    const confirmation = screen.getByLabelText("Confirm password");
    expect(confirmation).toBeRequired();
    expect(confirmation).toHaveAttribute("autocomplete", "new-password");

    fireEvent.change(password, { target: { value: "sample-passphrase" } });
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    expect(password).toHaveValue("sample-passphrase");
    expect(confirmation).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Show password confirmation" }));
    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(password).toHaveAttribute("type", "password");
    expect(confirmation).toHaveAttribute("type", "text");
    fireEvent.click(screen.getByRole("button", { name: "Hide password confirmation" }));
    expect(confirmation).toHaveAttribute("type", "password");
    expect(mockRegisterApi).not.toHaveBeenCalled();
  });

  it("blocks mismatched passwords and clears the mismatch when they match", () => {
    render(<MemoryRouter><Register /></MemoryRouter>);
    const password = screen.getByLabelText("Password");
    const confirmation = screen.getByLabelText("Confirm password");
    fireEvent.change(password, { target: { value: "sample-passphrase" } });
    fireEvent.change(confirmation, { target: { value: "different-passphrase" } });
    fireEvent.submit(password.form);
    expect(mockRegisterApi).not.toHaveBeenCalled();
    expect(confirmation).toHaveFocus();
    expect(confirmation).toHaveAccessibleDescription("Passwords do not match.");
    expect(confirmation).toHaveAttribute("aria-invalid", "true");
    fireEvent.change(confirmation, { target: { value: "sample-passphrase" } });
    expect(screen.queryByText("Passwords do not match.")).not.toBeInTheDocument();
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
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { name: "password", value: "sample-passphrase" },
    });

    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "sample-passphrase" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Register/i }));

    expect(screen.getByRole("button", { name: /Creating account/i })).toBeDisabled();

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
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { name: "password", value: "sample-passphrase" },
    });

    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "sample-passphrase" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Register/i }));

    expect(mockRegisterApi).toHaveBeenCalledWith({
      first_name: "Walid",
      last_name: "Rafiq",
      email: "walid@test.com",
      password: "sample-passphrase",
    });

    expect(
      await screen.findByText("Registration request received. You can now try signing in.")
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
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { name: "password", value: "sample-passphrase" },
    });

    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "sample-passphrase" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Register/i }));

    await waitFor(() => {
      expect(screen.getByText(/Email already exists/i)).toBeInTheDocument();
    });
  });
});
