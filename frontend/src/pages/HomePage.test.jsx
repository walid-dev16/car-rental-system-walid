import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "./HomePage.jsx";

vi.mock("../components/home/Navbar.jsx", () => ({
  default: () => <div>Navbar Section</div>,
}));

vi.mock("../components/home/HeroSection.jsx", () => ({
  default: () => <div>Hero Section</div>,
}));

vi.mock("../components/home/LuxuryShowcase.jsx", () => ({
  default: () => <div>Luxury Showcase Section</div>,
}));

vi.mock("../components/home/FeaturedCars.jsx", () => ({
  default: () => <div>Featured Cars Section</div>,
}));

vi.mock("../components/home/WhyChooseUs.jsx", () => ({
  default: () => <div>Why Choose Us Section</div>,
}));

vi.mock("../components/home/Footer.jsx", () => ({
  default: () => <div>Footer Section</div>,
}));

describe("HomePage", () => {
  it("renders all homepage sections", () => {
    render(<HomePage />);

    expect(screen.getByText(/Navbar Section/i)).toBeInTheDocument();
    expect(screen.getByText(/Hero Section/i)).toBeInTheDocument();
    expect(screen.getByText(/Luxury Showcase Section/i)).toBeInTheDocument();
    expect(screen.getByText(/Featured Cars Section/i)).toBeInTheDocument();
    expect(screen.getByText(/Why Choose Us Section/i)).toBeInTheDocument();
    expect(screen.getByText(/Footer Section/i)).toBeInTheDocument();
  });

  it("renders homepage wrapper", () => {
    const { container } = render(<HomePage />);
    expect(container.firstChild).toBeInTheDocument();
  });
});