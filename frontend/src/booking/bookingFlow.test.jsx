import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import API, { createBooking, fetchAvailableCars, updateProfile } from "../api/api.js";
import { saveSession } from "../auth/session.js";
import BookingPage from "../pages/BookingPage.jsx";
import CarDetailsPage from "../pages/CarDetailsPage.jsx";
import CarsPage from "../pages/CarsPage.jsx";
import { getBookingReturnTo } from "./bookingNavigation.js";
import { rentalPeriod } from "./time.js";

vi.mock("../api/api.js", () => ({
  default: { get: vi.fn() }, fetchAvailableCars: vi.fn(), createBooking: vi.fn(), updateProfile: vi.fn(),
}));

const car = { id: "29", brand: "Example", model: "Tourer", daily_price: "63.50", status: "available", available_branches: "Erfurt, Berlin" };
const customer = { id: "1", role: "customer", phone: "+49123456789", street_address: "Example Street 1", city: "Berlin", postal_code: "10115" };
const selection = "city=Berlin&dropoffCity=Erfurt&pickupDate=2099-06-05T10%3A00&returnDate=2099-06-06T10%3A00";

function visit(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/cars" element={<CarsPage />} />
        <Route path="/cars/:id" element={<CarDetailsPage />} />
        <Route path="/booking/:carId" element={<BookingPage />} />
        <Route path="/bookings" element={<h1>Management destination</h1>} />
        <Route path="/my-bookings" element={<h1>Customer destination</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  API.get.mockResolvedValue({ data: car });
  fetchAvailableCars.mockResolvedValue({ data: [car] });
  updateProfile.mockResolvedValue({ data: { user: customer } });
  createBooking.mockResolvedValue({ data: { id: "73", total_price: "63.50" } });
});

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

it("keeps selected dates and branches across search, details and the sign-in link", async () => {
  visit("/cars?" + selection);
  fireEvent.click(await screen.findByRole("button", { name: "Details" }));
  expect(fetchAvailableCars).toHaveBeenCalledWith({
    pickup_branch: "Berlin", dropoff_branch: "Erfurt",
    pickup_datetime: "2099-06-05T10:00", return_datetime: "2099-06-06T10:00",
  });
  fireEvent.click(await screen.findByRole("button", { name: "Book Now" }));
  const href = within(screen.getByRole("dialog")).getByRole("link", { name: "Login" }).getAttribute("href");
  const returnTo = getBookingReturnTo(new URL(href, "https://example.test").searchParams);
  expect(returnTo).toBe("/booking/29?" + selection);
});

it("submits selected branches and shows the stored price without sending a client-chosen total", async () => {
  saveSession("test-session", customer);
  visit("/booking/29?" + selection);
  expect(await screen.findByLabelText("Pickup branch")).toHaveValue("Berlin");
  expect(screen.getByLabelText("Return branch")).toHaveValue("Erfurt");
  const button = screen.getByRole("button", { name: "Confirm Booking" });
  fireEvent.click(button);
  expect(await screen.findByText("Booking #73 submitted. Total: €63.50.")).toBeInTheDocument();
  expect(button).toBeDisabled();
  expect(createBooking).toHaveBeenCalledWith({
    user_id: "1", car_id: "29", pickup_datetime: "2099-06-05T10:00", return_datetime: "2099-06-06T10:00",
    pickup_branch: "Berlin", dropoff_branch: "Erfurt", payment_method: "cash", notes: "",
  });
});

it("records unconfirmed branches honestly and sends a staff member to booking management", async () => {
  const staff = { ...customer, role: "staff" };
  saveSession("test-session", staff);
  updateProfile.mockResolvedValue({ data: { user: staff } });
  API.get.mockResolvedValue({ data: { ...car, available_branches: null } });
  visit("/booking/29?pickupDate=2099-06-05T10:00&returnDate=2099-06-06T10:00");
  expect(await screen.findByText(/branches need to be arranged/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Confirm Booking" }));
  expect(await screen.findByRole("heading", { name: "Management destination" }, { timeout: 4000 })).toBeInTheDocument();
  expect(createBooking).toHaveBeenCalledWith(expect.objectContaining({ pickup_branch: null, dropoff_branch: null }));
});

it("uses elapsed Berlin hours across daylight-saving changes and rejects a missing hour", () => {
  vi.useFakeTimers();
  try {
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    expect(rentalPeriod("2026-03-29T02:30", "2026-03-30T12:00").error).toBeTruthy();
    expect(rentalPeriod("2026-03-28T12:00", "2026-03-29T12:00")).toEqual({ days: 1 });
    expect(rentalPeriod("2026-10-24T12:00", "2026-10-25T12:00")).toEqual({ days: 2 });
    expect(rentalPeriod("2025-10-24T12:00", "2025-10-25T12:00").error).toBeTruthy();
  } finally {
    vi.useRealTimers();
  }
});
