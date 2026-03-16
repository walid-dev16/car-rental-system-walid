import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Footer from "./Footer.jsx";

describe("Footer Component", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders brand name", () => {
  render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>
  );

  expect(screen.getAllByText(/AutoLuxe/i).length).toBeGreaterThan(0);
});

  it("renders footer description text", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/Premium car rental experience/i)
    ).toBeInTheDocument();
  });

  it("renders quick links heading", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(screen.getByText(/Quick Links/i)).toBeInTheDocument();
  });

  it("renders important navigation links", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(screen.getAllByRole("link", { name: /Home/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /Cars/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /Why Us/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /Contact/i }).length).toBeGreaterThan(0);
  });

  it("renders contact details", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(screen.getByText(/Erfurt, Germany/i)).toBeInTheDocument();
    expect(screen.getByText(/\+49 157 0000 0000/i)).toBeInTheDocument();
  });

  it("shows login and register links when user is not logged in", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(screen.getAllByRole("link", { name: /Login/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /Register/i }).length).toBeGreaterThan(0);
  });
});