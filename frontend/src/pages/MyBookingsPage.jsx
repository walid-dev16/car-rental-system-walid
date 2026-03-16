import React, { useEffect, useState } from "react";
import { fetchMyBookings } from "../api/api.js";
import Navbar from "../components/home/Navbar.jsx";
import Footer from "../components/home/Footer.jsx";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMyBookings = async () => {
      try {
        const { data } = await fetchMyBookings();
        setBookings(data);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load your bookings.");
      } finally {
        setLoading(false);
      }
    };

    loadMyBookings();
  }, []);

  const getStatusStyle = (status) => {
    if (status === "booked") {
      return "border-green-500/30 bg-green-500/10 text-green-400";
    }
    if (status === "cancelled") {
      return "border-red-500/30 bg-red-500/10 text-red-400";
    }
    if (status === "pending") {
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";
    }
    return "border-white/10 bg-white/5 text-gray-300";
  };

  const formatDateTime = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="border-b border-white/10 bg-gradient-to-r from-[#0f0f0f] to-[#171717]">
        <div className="mx-auto max-w-[1500px] px-6 py-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#ff5f00]">
            My Reservations
          </p>
          <h1 className="text-4xl font-black text-white md:text-5xl">
            My Bookings
          </h1>
          <p className="mt-3 max-w-3xl text-gray-400">
            Review your booked, pending, and cancelled reservations in one place.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-6 py-10">
        {loading && (
          <div className="rounded-3xl border border-white/10 bg-[#111] p-10 text-center text-gray-400">
            Loading your bookings...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-red-500 bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-[#111] p-10 text-center text-gray-400">
            You do not have any bookings yet.
          </div>
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <article
                key={booking.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-[#111] shadow-xl"
              >
                <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr]">
                  <div className="h-72 bg-[#1b1b1b] lg:h-full">
                    {booking.car_image_url ? (
                      <img
                        src={booking.car_image_url}
                        alt={`${booking.car_brand} ${booking.car_model}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-500">
                        No image available
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="space-y-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h2 className="text-3xl font-bold text-white">
                            {booking.car_brand} {booking.car_model}
                          </h2>
                          <p className="mt-2 text-gray-400">
                            Booking #{booking.id} • Plate: {booking.car_plate_number}
                          </p>
                        </div>

                        <span
                          className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${getStatusStyle(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl bg-black/30 p-5">
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Pick-up
                          </p>
                          <p className="mt-3 text-sm text-white">
                            {formatDateTime(booking.pickup_datetime)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-black/30 p-5">
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Return
                          </p>
                          <p className="mt-3 text-sm text-white">
                            {formatDateTime(booking.return_datetime)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-black/30 p-5">
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Payment
                          </p>
                          <p className="mt-3 text-sm capitalize text-white">
                            {booking.payment_method || "cash"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-black/30 p-5">
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Total
                          </p>
                          <p className="mt-3 text-2xl font-black text-[#ff5f00]">
                            €{booking.total_price}
                          </p>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="rounded-2xl bg-black/30 p-5">
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Notes
                          </p>
                          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-300">
                            {booking.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}