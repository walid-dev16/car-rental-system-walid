import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import FeaturedCars from "./FeaturedCars.jsx";

describe("FeaturedCars Component", () => {
  it("renders section heading", () => {
    render(
      <MemoryRouter>
        <FeaturedCars />
      </MemoryRouter>
    );

    expect(screen.getByText(/Featured Fleet/i)).toBeInTheDocument();
    expect(screen.getByText(/Popular cars for rent/i)).toBeInTheDocument();
  });

  it("renders view all cars link", () => {
    render(
      <MemoryRouter>
        <FeaturedCars />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /View all cars/i })).toBeInTheDocument();
  });

  it("renders featured car names", () => {
    render(
      <MemoryRouter>
        <FeaturedCars />
      </MemoryRouter>
    );

    expect(screen.getByText(/BMW X5/i)).toBeInTheDocument();
    expect(screen.getByText(/Mercedes-Benz CLE/i)).toBeInTheDocument();
    expect(screen.getByText(/Audi A6 E-Tron/i)).toBeInTheDocument();
  });

  it("renders premium badges", () => {
  render(
    <MemoryRouter>
      <FeaturedCars />
    </MemoryRouter>
  );

  expect(screen.getAllByText(/Premium/i).length).toBeGreaterThanOrEqual(3);
});

  it("renders car prices", () => {
    render(
      <MemoryRouter>
        <FeaturedCars />
      </MemoryRouter>
    );

    expect(screen.getByText(/€310/i)).toBeInTheDocument();
    expect(screen.getByText(/€280/i)).toBeInTheDocument();
    expect(screen.getByText(/€260/i)).toBeInTheDocument();
  });

  it("renders detail and book links for all cars", () => {
    render(
      <MemoryRouter>
        <FeaturedCars />
      </MemoryRouter>
    );

    expect(screen.getAllByRole("link", { name: /Details/i }).length).toBe(3);
    expect(screen.getAllByRole("link", { name: /Book/i }).length).toBe(3);
  });

  it("renders rating text", () => {
    render(
      <MemoryRouter>
        <FeaturedCars />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/5.0/i).length).toBe(3);
  });

  it("renders car images with alt text", () => {
    render(
      <MemoryRouter>
        <FeaturedCars />
      </MemoryRouter>
    );

    expect(screen.getByAltText(/BMW X5/i)).toBeInTheDocument();
    expect(screen.getByAltText(/Mercedes-Benz CLE/i)).toBeInTheDocument();
    expect(screen.getByAltText(/Audi A6 E-Tron/i)).toBeInTheDocument();
  });
});