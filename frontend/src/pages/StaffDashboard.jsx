import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api.js";
import DashboardHeader from "../components/DashboardHeader.jsx";
import {
  ClipboardList,
  Clock3,
  CheckCircle2,
  XCircle,
  ArrowRight,
  User,
  CarFront,
  CalendarDays,
  CreditCard,
  StickyNote,
} from "lucide-react";

export default function StaffDashboard() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadBookings = async () => {
    try {
      const { data } = await API.get("/bookings");
      setBookings(data);
    } catch {
      setError("Failed to load bookings");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await loadBookings();
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const handleComplete = async (id) => {
    setError("");
    setSuccess("");

    try {
      await API.patch(`/bookings/${id}/complete`);
      await loadBookings();
      setSuccess("Booking confirmed successfully.");
    } catch {
      setError("Failed to confirm booking");
    }
  };

  const handleCancel = async (id) => {
    setError("");
    setSuccess("");

    try {
      await API.patch(`/bookings/${id}/cancel`);
      await loadBookings();
      setSuccess("Booking cancelled successfully.");
    } catch {
      setError("Failed to cancel booking");
    }
  };

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter((b) => b.status === "pending").length,
      booked: bookings.filter((b) => b.status === "booked").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
    };
  }, [bookings]);

  const pendingBookings = useMemo(() => {
    return bookings.filter((b) => b.status === "pending");
  }, [bookings]);

  const recentBookings = useMemo(() => {
    return bookings.slice(0, 6);
  }, [bookings]);

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
    <div className="min-h-screen bg-black p-8 text-white">
      <DashboardHeader title="Staff Dashboard" />

      <section className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-r from-[#111] to-[#1a1a1a] p-8 shadow-xl">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#ff5f00]">
              Staff Control Panel
            </p>
            <h2 className="text-4xl font-black text-white">
              Manage reservations quickly and clearly
            </h2>
            <p className="mt-3 max-w-3xl text-gray-400">
              Review booking requests, confirm customer reservations, cancel invalid
              requests, and keep the booking flow organized.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/bookings")}
              className="rounded-2xl bg-[#ff5f00] px-5 py-3 font-bold text-white transition hover:bg-[#e55500]"
            >
              Open Bookings
            </button>

            <button
              onClick={() => navigate("/")}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
            >
              View Site
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-lg border border-green-500 bg-green-500/10 p-4 text-green-400">
          {success}
        </div>
      )}

      <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-[#111] p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-400">Total Bookings</span>
            <ClipboardList size={18} className="text-[#ff5f00]" />
          </div>
          <p className="text-4xl font-black text-white">{stats.total}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#111] p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-400">Pending</span>
            <Clock3 size={18} className="text-yellow-400" />
          </div>
          <p className="text-4xl font-black text-white">{stats.pending}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#111] p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-400">Confirmed</span>
            <CheckCircle2 size={18} className="text-green-400" />
          </div>
          <p className="text-4xl font-black text-white">{stats.booked}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#111] p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-400">Cancelled</span>
            <XCircle size={18} className="text-red-400" />
          </div>
          <p className="text-4xl font-black text-white">{stats.cancelled}</p>
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-2xl font-black text-white">Pending Bookings</h3>
          <button
            onClick={() => navigate("/bookings")}
            className="flex items-center gap-2 text-sm font-semibold text-[#ff8a3d] transition hover:text-[#ff5f00]"
          >
            View all bookings
            <ArrowRight size={16} />
          </button>
        </div>

        {pendingBookings.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-[#111] p-10 text-center text-gray-400">
            No pending bookings right now.
          </div>
        ) : (
          <div className="space-y-6">
            {pendingBookings.slice(0, 3).map((booking) => (
              <article
                key={booking.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-[#111] shadow-xl"
              >
                <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr]">
                  <div className="h-64 bg-[#1b1b1b] lg:h-full">
                    {booking.car_image_url ? (
                      <img
                        src={booking.car_image_url}
                        alt={`${booking.car_brand} ${booking.car_model}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-base text-gray-500">
                        No image available
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex-1 space-y-5">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h4 className="text-3xl font-bold text-white">
                              Booking #{booking.id}
                            </h4>
                            <p className="mt-2 text-gray-400">
                              {booking.car_brand} {booking.car_model} • {booking.car_plate_number}
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

                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="rounded-2xl bg-black/30 p-5">
                            <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                              <User size={14} />
                              Customer
                            </p>
                            <p className="mt-3 text-white">
                              {booking.customer_first_name || ""} {booking.customer_last_name || ""}
                            </p>
                            <p className="mt-1 text-sm text-gray-400">
                              {booking.customer_email || "N/A"}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-black/30 p-5">
                            <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                              <CalendarDays size={14} />
                              Booking Time
                            </p>
                            <p className="mt-3 text-sm text-white">
                              Pickup: {formatDateTime(booking.pickup_datetime)}
                            </p>
                            <p className="mt-1 text-sm text-white">
                              Return: {formatDateTime(booking.return_datetime)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-black/30 p-5">
                            <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                              <CreditCard size={14} />
                              Total
                            </p>
                            <p className="mt-3 text-2xl font-black text-[#ff5f00]">
                              €{booking.total_price}
                            </p>
                          </div>
                        </div>

                        {booking.notes && (
                          <div className="rounded-2xl bg-black/30 p-5">
                            <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                              <StickyNote size={14} />
                              Notes
                            </p>
                            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-300">
                              {booking.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3 xl:w-[230px] xl:flex-col">
                        <button
                          onClick={() => handleComplete(booking.id)}
                          className="rounded-2xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
                        >
                          Confirm Booking
                        </button>

                        <button
                          onClick={() => handleCancel(booking.id)}
                          className="rounded-2xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"
                        >
                          Cancel Booking
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-2xl font-black text-white">Recent Bookings</h3>
          <button
            onClick={() => navigate("/bookings")}
            className="flex items-center gap-2 text-sm font-semibold text-[#ff8a3d] transition hover:text-[#ff5f00]"
          >
            Open full bookings page
            <ArrowRight size={16} />
          </button>
        </div>

        {recentBookings.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-[#111] p-10 text-center text-gray-400">
            No bookings found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            {recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-[#111] shadow-xl"
              >
                <div className="h-56 bg-[#1b1b1b]">
                  {booking.car_image_url ? (
                    <img
                      src={booking.car_image_url}
                      alt={`${booking.car_brand} ${booking.car_model}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-base text-gray-500">
                      No image available
                    </div>
                  )}
                </div>

                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-2xl font-bold text-white">
                        Booking #{booking.id}
                      </h4>
                      <p className="mt-1 text-sm text-gray-400">
                        {booking.car_brand} {booking.car_model}
                      </p>
                    </div>

                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
                        booking.status
                      )}`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-black/30 p-4">
                      <p className="text-xs text-gray-500">Customer</p>
                      <p className="mt-2 text-sm text-white">
                        {booking.customer_first_name || ""} {booking.customer_last_name || ""}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/30 p-4">
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="mt-2 text-sm font-bold text-[#ff5f00]">
                        €{booking.total_price}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/30 p-4">
                      <p className="text-xs text-gray-500">Pickup</p>
                      <p className="mt-2 text-sm text-white">
                        {formatDateTime(booking.pickup_datetime)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/30 p-4">
                      <p className="text-xs text-gray-500">Return</p>
                      <p className="mt-2 text-sm text-white">
                        {formatDateTime(booking.return_datetime)}
                      </p>
                    </div>
                  </div>

                  {!["booked", "cancelled"].includes(booking.status) && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleComplete(booking.id)}
                        className="flex-1 rounded-2xl bg-green-600 py-3 font-semibold text-white hover:bg-green-700"
                      >
                        Confirm
                      </button>

                      <button
                        onClick={() => handleCancel(booking.id)}
                        className="flex-1 rounded-2xl bg-red-600 py-3 font-semibold text-white hover:bg-red-700"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}