import { afterEach, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { fetchCars, editCar } from "../api/api.js";
import AdminCars from "./AdminCars.jsx";

vi.mock("../api/api.js", () => ({
  fetchCars: vi.fn(), editCar: vi.fn(), addCar: vi.fn(), deleteCar: vi.fn(),
}));

afterEach(() => { vi.restoreAllMocks(); });

it("keeps the operational status, branches and legacy choices when editing an older car", async () => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  const car = {
    id: "5", brand: "Sample", model: "Estate", production_year: 2020,
    category: "estate", transmission: "manual", fuel_type: "diesel", seats: 5, doors: 4,
    plate_number: "DEMO-5", daily_price: "39.95", status: "booked", operational_status: "available",
    available_branches: " hamburg, BERLIN, Historical Branch ",
  };
  fetchCars.mockResolvedValue({ data: [car] });
  editCar.mockResolvedValue({ data: car });
  render(<MemoryRouter><AdminCars /></MemoryRouter>);
  fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
  expect(screen.getByLabelText("Category")).toHaveValue("estate");
  expect(screen.getByLabelText("Operational status")).toHaveValue("available");
  expect(screen.getByLabelText("Production year")).toHaveValue(2020);
  expect(screen.getByLabelText("Hamburg")).toBeChecked();
  expect(screen.getByLabelText("Berlin")).toBeChecked();
  fireEvent.click(screen.getByRole("button", { name: "Update Car" }));
  await waitFor(() => expect(editCar).toHaveBeenCalledWith("5", expect.objectContaining({
    category: "estate", status: "available", available_branches: "Berlin, Hamburg", preserve_available_branches: true,
    production_year: 2020, daily_price: "39.95",
  })));
});
