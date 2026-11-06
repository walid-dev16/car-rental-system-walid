import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import API, { createBooking, updateProfile } from "../api/api.js";
import Navbar from "../components/home/Navbar.jsx";
import Footer from "../components/home/Footer.jsx";

function toDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (num) => String(num).padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getGermanLocalPhone(rawPhone = "") {
  const cleaned = String(rawPhone).replace(/\s+/g, "").trim();

  if (!cleaned) return "";
  if (cleaned.startsWith("+49")) return cleaned.slice(3);
  if (cleaned.startsWith("0049")) return cleaned.slice(4);
  if (cleaned.startsWith("0")) return cleaned.slice(1);

  return cleaned;
}

function buildGermanPhone(localPhone = "") {
  const digits = String(localPhone).replace(/\D/g, "");
  return digits ? `+49${digits}` : "";
}

export default function BookingPage() {
  const { carId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [redirectCountdown, setRedirectCountdown] = useState(7);

  const [phoneLocal, setPhoneLocal] = useState(
    getGermanLocalPhone(user?.phone || "")
  );

  const [formData, setFormData] = useState({
    pickup_datetime: toDateTimeLocal(searchParams.get("pickupDate")),
    return_datetime: toDateTimeLocal(searchParams.get("returnDate")),
    payment_method: "cash",
    street_address: user?.street_address || "",
    city: user?.city || "",
    postal_code: user?.postal_code || "",
    notes: "",
  });

  useEffect(() => {
    const loadCar = async () => {
      try {
        const { data } = await API.get(`/cars/${carId}`);
        setCar(data);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load car details.");
      } finally {
        setLoading(false);
      }
    };

    loadCar();
  }, [carId]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 7000);

      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (!success) return;

    setRedirectCountdown(7);

    const clearTimer = setTimeout(() => {
      setSuccess("");
    }, 7000);

    const countdownTimer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(clearTimer);
      clearInterval(countdownTimer);
    };
  }, [success]);

  const totalDays = useMemo(() => {
    if (!formData.pickup_datetime || !formData.return_datetime) return 0;

    const start = new Date(formData.pickup_datetime);
    const end = new Date(formData.return_datetime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    if (end <= start) return 0;

    const diffMs = end.getTime() - start.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }, [formData.pickup_datetime, formData.return_datetime]);

  const totalPrice = useMemo(() => {
    if (!car || !totalDays) return 0;
    return Number(car.daily_price) * totalDays;
  }, [car, totalDays]);

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user) {
      setError("Please login first to continue booking.");
      return;
    }

    if (!phoneLocal.trim()) {
      setError("Phone number is required.");
      return;
    }

    if (!formData.street_address.trim()) {
      setError("Street address is required.");
      return;
    }

    if (!formData.city.trim()) {
      setError("City is required.");
      return;
    }

    if (!formData.postal_code.trim()) {
      setError("Postal code is required.");
      return;
    }

    if (!formData.pickup_datetime || !formData.return_datetime) {
      setError("Please select pickup and return date/time.");
      return;
    }

    if (!car) {
      setError("Car information is missing.");
      return;
    }

    if (totalDays <= 0) {
      setError("Return date/time must be after pickup date/time.");
      return;
    }

    if (totalDays > 30) {
      setError("Rentals cannot exceed 30 days.");
      return;
    }

    const now = Date.now();
    if (new Date(formData.pickup_datetime).getTime() < now - 5 * 60 * 1000) {
      setError("Pickup date cannot be in the past.");
      return;
    }

    if (new Date(formData.return_datetime).getTime() > now + 365 * 24 * 60 * 60 * 1000) {
      setError("Bookings must end within 365 days.");
      return;
    }

    const fullPhone = buildGermanPhone(phoneLocal);

    const mergedNotes = [formData.notes?.trim() || ""].filter(Boolean).join("\n");

    try {
      await updateProfile({
        phone: fullPhone,
        street_address: formData.street_address,
        city: formData.city,
        postal_code: formData.postal_code,
      });

      await createBooking({
        car_id: carId,
        pickup_datetime: new Date(formData.pickup_datetime).toISOString(),
        return_datetime: new Date(formData.return_datetime).toISOString(),
        payment_method: formData.payment_method,
        notes: mergedNotes,
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
      setSuccess("Booking request submitted. Your reservation is held for 15 minutes pending confirmation.");

      setTimeout(() => {
        navigate("/my-bookings");
      }, 7000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create booking.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="mx-auto max-w-[1500px] px-6 py-16 text-center text-gray-400">
          Loading booking page...
        </div>
        <Footer />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="mx-auto max-w-[1500px] px-6 py-16 text-center text-red-400">
          {error || "Car not found."}
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="border-b border-white/10 bg-gradient-to-r from-[#0f0f0f] to-[#171717]">
        <div className="mx-auto max-w-[1500px] px-6 py-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#ff5f00]">
            Booking Checkout
          </p>
          <h1 className="text-4xl font-black text-white md:text-5xl">
            Complete Your Booking
          </h1>
          <p className="mt-3 max-w-3xl text-gray-400">
            Review the selected car, choose your booking details, and confirm your reservation.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-6 py-10">
        {error && (
          <div className="mb-6 rounded-lg border border-red-500 bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg border border-green-500 bg-green-500/10 p-4 text-green-400">
            <p className="font-semibold">{success}</p>
            <p className="mt-2 text-sm text-green-300">
              You will be redirected to My Bookings in {redirectCountdown} second
              {redirectCountdown !== 1 ? "s" : ""}.
            </p>
          </div>
        )}

        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="overflow-hidden rounded-3xl border border-white/10 bg-[#111] shadow-xl">
            <div className="h-[360px] bg-[#1b1b1b]">
              {car.image_url ? (
                <img
                  src={car.image_url}
                  alt={`${car.brand} ${car.model}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-500">
                  No image available
                </div>
              )}
            </div>

            <div className="space-y-5 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black text-white">
                    {car.brand} {car.model}
                  </h2>
                  <p className="mt-2 text-gray-400">
                    {car.production_year} • {car.category} • {car.transmission}
                  </p>
                </div>

                <span className="rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-400">
                  {car.status}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-black/30 p-5">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Plate</p>
                  <p className="mt-2 text-lg font-semibold text-white">{car.plate_number}</p>
                </div>

                <div className="rounded-2xl bg-black/30 p-5">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Seats</p>
                  <p className="mt-2 text-lg font-semibold text-white">{car.seats}</p>
                </div>

                <div className="rounded-2xl bg-black/30 p-5">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Fuel Type</p>
                  <p className="mt-2 text-lg font-semibold text-white capitalize">{car.fuel_type}</p>
                </div>

                <div className="rounded-2xl bg-black/30 p-5">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Daily Price</p>
                  <p className="mt-2 text-2xl font-black text-[#ff5f00]">€{car.daily_price}</p>
                </div>
              </div>

              {car.description && (
                <div className="rounded-2xl bg-black/30 p-5">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Description</p>
                  <p className="mt-3 leading-7 text-gray-300">{car.description}</p>
                </div>
              )}
            </div>
          </article>

          <div className="rounded-3xl border border-white/10 bg-[#111] p-6 shadow-xl">
            <h3 className="text-2xl font-black text-white">Booking Details</h3>

            <div className="mt-6 rounded-2xl bg-black/30 p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500">Customer Info</p>
              <p className="mt-3 text-white">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="mt-1 text-gray-400">{user?.email}</p>
              <p className="mt-1 text-gray-400">
                {phoneLocal ? `+49 ${phoneLocal}` : "Phone number is required"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Phone Number <span className="text-red-400">*</span>
                </label>

                <div className="flex overflow-hidden rounded-2xl border border-white/10 bg-[#1c1c1c]">
                  <div className="flex items-center border-r border-white/10 px-4 text-white">
                    +49
                  </div>
                  <input
                    type="tel"
                    value={phoneLocal}
                    onChange={(e) => setPhoneLocal(e.target.value.replace(/\D/g, ""))}
                    placeholder="1512345678"
                    className="w-full bg-transparent px-4 py-4 text-white outline-none"
                  />
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  Enter your number without the country code.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Street Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="street_address"
                  value={formData.street_address}
                  onChange={handleChange}
                  placeholder="Enter your street address"
                  className="w-full rounded-2xl border border-white/10 bg-[#1c1c1c] px-4 py-4 text-white outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  City <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Enter your city"
                  className="w-full rounded-2xl border border-white/10 bg-[#1c1c1c] px-4 py-4 text-white outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Postal Code <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  placeholder="Enter your postal code"
                  className="w-full rounded-2xl border border-white/10 bg-[#1c1c1c] px-4 py-4 text-white outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Pick-up Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="pickup_datetime"
                  required
                  value={formData.pickup_datetime}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/10 bg-[#1c1c1c] px-4 py-4 text-white outline-none [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Return Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="return_datetime"
                  required
                  value={formData.return_datetime}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/10 bg-[#1c1c1c] px-4 py-4 text-white outline-none [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Payment Method
                </label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/10 bg-[#1c1c1c] px-4 py-4 text-white outline-none"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Notes
                </label>
                <textarea
                  name="notes"
                  maxLength={2000}
                  value={formData.notes}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Any special requests or delivery notes..."
                  className="w-full rounded-2xl border border-white/10 bg-[#1c1c1c] px-4 py-4 text-white outline-none"
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <h4 className="text-lg font-bold text-white">Price Summary</h4>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between text-gray-300">
                    <span>Daily price</span>
                    <span>€{car.daily_price}</span>
                  </div>

                  <div className="flex items-center justify-between text-gray-300">
                    <span>Total days</span>
                    <span>{totalDays}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-lg font-black text-white">
                    <span>Total</span>
                    <span className="text-[#ff5f00]">€{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-[#ff5f00] px-6 py-4 font-bold text-white transition hover:bg-[#e55500]"
                >
                  Confirm Booking
                </button>

                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="rounded-2xl border border-white/10 px-6 py-4 font-semibold text-white hover:border-white/30"
                >
                  Back
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
