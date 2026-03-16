import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BrandLogo from "./BrandLogo.jsx";

describe("BrandLogo Component", () => {
  it("renders brand name and tagline", () => {
    render(<BrandLogo />);

    expect(screen.getByText(/AutoLuxe/i)).toBeInTheDocument();
    expect(screen.getByText(/Premium Car Rental/i)).toBeInTheDocument();
  });

  it("renders AL badge", () => {
    render(<BrandLogo />);

    expect(screen.getByText(/^AL$/i)).toBeInTheDocument();
  });

  it("renders with default size", () => {
    const { container } = render(<BrandLogo />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders with small size", () => {
    render(<BrandLogo size="sm" />);
    expect(screen.getByText(/AutoLuxe/i)).toBeInTheDocument();
  });

  it("renders with medium size", () => {
    render(<BrandLogo size="md" />);
    expect(screen.getByText(/AutoLuxe/i)).toBeInTheDocument();
  });

  it("renders with large size", () => {
    render(<BrandLogo size="lg" />);
    expect(screen.getByText(/AutoLuxe/i)).toBeInTheDocument();
  });

  it("falls back to medium size for invalid size", () => {
    render(<BrandLogo size="wrong-size" />);
    expect(screen.getByText(/AutoLuxe/i)).toBeInTheDocument();
  });
});