import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ContactPage from "./ContactPage.jsx";

vi.mock("../components/home/Navbar.jsx", () => ({
  default: () => <div>Navbar Section</div>,
}));

vi.mock("../components/home/Footer.jsx", () => ({
  default: () => <div>Footer Section</div>,
}));

describe("ContactPage", () => {
  it("renders navbar and footer", () => {
    render(<ContactPage />);

    expect(screen.getByText(/Navbar Section/i)).toBeInTheDocument();
    expect(screen.getByText(/Footer Section/i)).toBeInTheDocument();
  });

  it("renders page heading and intro text", () => {
    render(<ContactPage />);

    expect(screen.getByText(/Contact Us/i)).toBeInTheDocument();
    expect(screen.getByText(/We’re here to help/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Have a question about bookings, cars, pricing, or support/i)
    ).toBeInTheDocument();
  });

  it("renders contact form fields", () => {
    render(<ContactPage />);

    expect(screen.getByPlaceholderText(/Your full name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/How can we help\?/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Write your message here/i)).toBeInTheDocument();
  });

  it("renders send message button", () => {
    render(<ContactPage />);

    expect(screen.getByRole("button", { name: /Send Message/i })).toBeInTheDocument();
  });

  it("renders contact information section", () => {
    render(<ContactPage />);

    expect(screen.getByText(/Contact Information/i)).toBeInTheDocument();
    expect(screen.getByText(/support@autoluxe.com/i)).toBeInTheDocument();
    expect(screen.getByText(/\+49 123 456 7890/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Erfurt, Germany/i).length).toBeGreaterThan(0);
  });

  it("renders working hours", () => {
  render(<ContactPage />);

  expect(screen.getAllByText(/Working Hours/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/Monday - Friday/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/08:00 - 18:00/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/Saturday/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/10:00 - 16:00/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/Sunday/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/Closed/i).length).toBeGreaterThan(0);
});

  it("renders quick support section", () => {
    render(<ContactPage />);

    expect(screen.getByText(/Need quick support\?/i)).toBeInTheDocument();
    expect(
      screen.getByText(/For urgent booking issues, contact our support team/i)
    ).toBeInTheDocument();
  });
});