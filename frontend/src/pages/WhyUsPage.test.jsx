import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import WhyUsPage from "./WhyUsPage.jsx";

vi.mock("../components/home/Navbar.jsx", () => ({
  default: () => <div>Navbar Section</div>,
}));

vi.mock("../components/home/Footer.jsx", () => ({
  default: () => <div>Footer Section</div>,
}));

describe("WhyUsPage", () => {
  it("renders navbar and footer", () => {
    render(<WhyUsPage />);

    expect(screen.getByText(/Navbar Section/i)).toBeInTheDocument();
    expect(screen.getByText(/Footer Section/i)).toBeInTheDocument();
  });

  it("renders hero heading and intro", () => {
    render(<WhyUsPage />);

    expect(screen.getByText(/Why Choose AutoLuxe/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Premium rental experience, built to feel easy/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/AutoLuxe combines elegant design, premium vehicles/i)
    ).toBeInTheDocument();
  });

  it("renders highlight cards", () => {
    render(<WhyUsPage />);

    expect(screen.getByText(/Transparent Pricing/i)).toBeInTheDocument();
    expect(screen.getByText(/Premium Vehicle Fleet/i)).toBeInTheDocument();
    expect(screen.getByText(/Easy Booking Process/i)).toBeInTheDocument();
    expect(screen.getByText(/Reliable & Secure/i)).toBeInTheDocument();
    expect(screen.getByText(/Helpful Support/i)).toBeInTheDocument();
    expect(screen.getByText(/Multiple City Coverage/i)).toBeInTheDocument();
  });

  it("renders stats section", () => {
    render(<WhyUsPage />);

    expect(screen.getByText(/15\+/i)).toBeInTheDocument();
    expect(screen.getByText(/Cars in fleet/i)).toBeInTheDocument();
    expect(screen.getByText(/^5$/i)).toBeInTheDocument();
    expect(screen.getByText(/Supported cities/i)).toBeInTheDocument();
    expect(screen.getByText(/24\/7/i)).toBeInTheDocument();
    expect(screen.getByText(/Online access/i)).toBeInTheDocument();
    expect(screen.getByText(/100%/i)).toBeInTheDocument();
    expect(screen.getByText(/Focused on simplicity/i)).toBeInTheDocument();
  });

  it("renders how it works steps", () => {
    render(<WhyUsPage />);

    expect(screen.getByText(/How it works/i)).toBeInTheDocument();
    expect(screen.getByText(/Simple process, better control/i)).toBeInTheDocument();
    expect(screen.getByText(/Browse Cars/i)).toBeInTheDocument();
    expect(screen.getByText(/Choose Your Dates/i)).toBeInTheDocument();
    expect(screen.getByText(/Confirm Reservation/i)).toBeInTheDocument();
    expect(screen.getByText(/Manage with Ease/i)).toBeInTheDocument();
  });

  it("renders what makes us different section", () => {
    render(<WhyUsPage />);

    expect(screen.getByText(/What makes us different\?/i)).toBeInTheDocument();
    expect(
      screen.getByText(/AutoLuxe is designed not only for customers/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This means the whole system stays easier to manage/i)
    ).toBeInTheDocument();
  });

  it("renders service promise section", () => {
    render(<WhyUsPage />);

    expect(screen.getByText(/Service promise/i)).toBeInTheDocument();
    expect(screen.getByText(/Fast booking experience/i)).toBeInTheDocument();
    expect(screen.getByText(/Premium fleet presentation/i)).toBeInTheDocument();
    expect(screen.getByText(/Booking and user management/i)).toBeInTheDocument();
    expect(screen.getByText(/Clear operational overview/i)).toBeInTheDocument();

    expect(screen.getAllByText(/Included/i).length).toBeGreaterThan(0);
  });

  it("renders built for modern rentals section", () => {
    render(<WhyUsPage />);

    expect(screen.getByText(/Built for modern rentals/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Whether someone is just browsing as a guest/i)
    ).toBeInTheDocument();
  });
});