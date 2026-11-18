import { afterEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { fetchAvailableCars } from "../../api/api.js";
import FeaturedCars from "./FeaturedCars.jsx";

vi.mock("../../api/api.js", () => ({ fetchAvailableCars: vi.fn() }));
afterEach(() => vi.clearAllMocks());

function renderFleet() {
  render(<MemoryRouter><FeaturedCars /></MemoryRouter>);
}

it("uses inventory IDs, prices and images for at most three featured cars", async () => {
  const inventory = ["A", "B", "C", "D"].map((model, i) => ({
    id: 80 + i, brand: "Example", model, daily_price: "47.50", image_url: `/fleet/${model}.webp`,
  }));
  fetchAvailableCars.mockResolvedValue({ data: inventory });
  renderFleet();
  expect(await screen.findByRole("heading", { name: "Example A" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Example D" })).toBeNull();
  expect(screen.getAllByRole("link", { name: "Details" })[0]).toHaveAttribute("href", "/cars/80");
  expect(screen.getAllByRole("link", { name: "Book" })[0]).toHaveAttribute("href", "/cars/80");
  expect(screen.getAllByText(/€47.50/)).toHaveLength(3);
  const pictures = screen.getAllByRole("img");
  expect(pictures.map(image => image.alt)).toEqual(["Example A", "Example B", "Example C"]);
  expect(pictures.map(image => image.getAttribute("src"))).toEqual(inventory.slice(0, 3).map(car => car.image_url));
});

it("renders an empty inventory without fictional cars", async () => {
  fetchAvailableCars.mockResolvedValue({ data: [] });
  renderFleet();
  expect(await screen.findByText("No cars are available right now.")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Book" })).toBeNull();
});

it("reports an inventory failure", async () => {
  fetchAvailableCars.mockRejectedValue(new Error("offline"));
  renderFleet();
  expect(await screen.findByRole("alert")).toHaveTextContent("Featured cars could not be loaded.");
});
