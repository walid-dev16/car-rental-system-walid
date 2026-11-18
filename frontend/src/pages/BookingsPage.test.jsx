import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import API from "../api/api.js";
import BookingsPage from "./BookingsPage.jsx";

vi.mock("../api/api.js", () => ({ default: { get: vi.fn(), put: vi.fn() } }));

// Both pickup and return occur during the repeated hour when Berlin leaves daylight saving time.
const booking = {
  id: "17",
  status: "booked",
  pickup_datetime: "2026-10-25T00:30:12.000Z",
  return_datetime: "2026-10-25T01:45:35.000Z",
  total_price: "199.95",
};

beforeEach(() => {
  API.get.mockResolvedValue({ data: [booking] });
  API.put.mockResolvedValue({ data: {} });
  localStorage.setItem("user", JSON.stringify({ role: "admin" }));
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

async function openEditor() {
  render(<MemoryRouter><BookingsPage /></MemoryRouter>);
  fireEvent.click(await screen.findByRole("button", { name: "Edit Booking" }));
}

it("keeps the original instants when an admin changes only the price", async () => {
  await openEditor();
  expect(screen.getByLabelText(/Pickup Date/)).toHaveValue("2026-10-25T02:30");
  expect(screen.getByLabelText(/Return Date/)).toHaveValue("2026-10-25T02:45");
  fireEvent.change(screen.getByLabelText(/Override total price/), { target: { value: "186.75" } });
  fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
  await waitFor(() => expect(API.put).toHaveBeenCalledWith("/bookings/17", {
    pickup_datetime: booking.pickup_datetime,
    return_datetime: booking.return_datetime,
    total_price: "186.75",
  }));
});

it("sends edited branch times and lets the server recalculate the price", async () => {
  await openEditor();
  fireEvent.change(screen.getByLabelText(/Return Date/), { target: { value: "2026-10-27T14:30" } });
  fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
  await waitFor(() => expect(API.put).toHaveBeenCalledWith("/bookings/17", {
    pickup_datetime: booking.pickup_datetime,
    return_datetime: "2026-10-27T14:30",
  }));
});
