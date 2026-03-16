import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../api/api.js";
import Navbar from "../components/home/Navbar.jsx";
import Footer from "../components/home/Footer.jsx";
import {
  ClipboardList,
  Clock3,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  User,
  CarFront,
  CalendarDays,
  CreditCard,
  StickyNote,
} from "lucide-react";

export default function BookingsPage() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [searchParams] = useSearchParams();
  const selectedUserId = searchParams.get("userId");

  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingBookingId, setEditingBookingId] = useState(null);
  const [editForm, setEditForm] = useState({
    pickup_datetime: "",
    return_datetime: "",
    total_price: "",
  });

  const loadBookings = async () => {
    try {
      const { data } = await API.get("/bookings");
      setBookings(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load bookings");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await loadBookings();
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const filteredBookings = useMemo(() => {
    if (!selectedUserId) return bookings;
    return bookings.filter(
      (booking) => String(booking.user_id) === String(selectedUserId)
    );
  }, [bookings, selectedUserId]);

  const stats = useMemo(() => {
    const source = filteredBookings;
    return {
      total: source.length,
      pending: source.filter((b) => b.status === "pending").length,
      booked: source.filter((b) => b.status === "booked").length,
      cancelled: source.filter((b) => b.status === "cancelled").length,
    };
  }, [filteredBookings]);

  const handleComplete = async (id) => {
    setError("");
    setSuccess("");

    try {
      await API.patch(`/bookings/${id}/complete`);
      await loadBookings();
      setSuccess("Booking confirmed successfully.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to confirm booking");
    }
  };

  const handleDeleteBooking = async (id) => {
    setError("");
    setSuccess("");

    const confirmed = window.confirm(
      "Are you sure you want to delete this booking? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      await API.delete(`/bookings/${id}`);
      await loadBookings();
      setSuccess("Booking deleted successfully.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete booking");
    }
  };

  const handleCancel = async (id) => {
    setError("");
    setSuccess("");

    try {
      await API.patch(`/bookings/${id}/cancel`);
      await loadBookings();
      setSuccess("Booking cancelled successfully.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to cancel booking");
    }
  };

  const openEditForm = (booking) => {
    setEditingBookingId(booking.id);

    const pickupValue = booking.pickup_datetime
      ? new Date(booking.pickup_datetime).toISOString().slice(0, 16)
      : "";

    const returnValue = booking.return_datetime
      ? new Date(booking.return_datetime).toISOString().slice(0, 16)
      : "";

    setEditForm({
      pickup_datetime: pickupValue,
      return_datetime: returnValue,
      total_price: booking.total_price?.toString() || "",
    });

    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditChange = (e) => {
    setEditForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCancelEdit = () => {
    setEditingBookingId(null);
    setEditForm({
      pickup_datetime: "",
      return_datetime: "",
      total_price: "",
    });
  };

  const handleUpdateBooking = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!editingBookingId) return;

    try {
      await API.put(`/bookings/${editingBookingId}`, {
        pickup_datetime: new Date(editForm.pickup_datetime).toISOString(),
        return_datetime: new Date(editForm.return_datetime).toISOString(),
        total_price: Number(editForm.total_price),
      });

      await loadBookings();
      setSuccess("Booking updated successfully.");
      handleCancelEdit();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update booking");
    }
  };

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
    if (status === "completed") {
      return "border-blue-500/30 bg-blue-500/10 text-blue-400";
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
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#ff5f00]">
                Booking Management
              </p>
              <h1 className="text-4xl font-black text-white md:text-5xl">
                {selectedUserId ? `User Bookings #${selectedUserId}` : "All Bookings"}
              </h1>
              <p className="mt-3 max-w-3xl text-gray-400">
                {selectedUserId
                  ? "Viewing bookings for the selected user."
                  : "Review customer bookings, monitor statuses, and manage reservations."}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-lg">
              <div className="flex items-center gap-3">
                <ClipboardList className="text-[#ff5f00]" size={20} />
                <div>
                  <p className="text-sm text-gray-400">Visible Bookings</p>
                  <p className="text-3xl font-black text-white">{stats.total}</p>
                </div>
              </div>
            </div>
          </div>
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
            {success}
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-[#111] p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-gray-400">Total</span>
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
        </div>

        {editingBookingId && user?.role === "admin" && (
          <div className="mb-8 rounded-3xl border border-white/10 bg-[#111] p-6 shadow-xl">
            <h2 className="mb-5 text-2xl font-bold text-white">
              Edit Booking #{editingBookingId}
            </h2>

            <form onSubmit={handleUpdateBooking} className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Pickup Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="pickup_datetime"
                  value={editForm.pickup_datetime}
                  onChange={handleEditChange}
                  className="w-full rounded-2xl bg-[#222] p-3 text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Return Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="return_datetime"
                  value={editForm.return_datetime}
                  onChange={handleEditChange}
                  className="w-full rounded-2xl bg-[#222] p-3 text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Total Price
                </label>
                <input
                  type="number"
                  name="total_price"
                  value={editForm.total_price}
                  onChange={handleEditChange}
                  className="w-full rounded-2xl bg-[#222] p-3 text-white outline-none"
                  required
                />
              </div>

              <div className="flex gap-3 md:col-span-3">
                <button
                  type="submit"
                  className="rounded-2xl bg-[#ff5f00] px-6 py-3 font-semibold text-white hover:bg-[#e55500]"
                >
                  Save Changes
                </button>

                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white hover:border-white/30"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {filteredBookings.length === 0 && !error ? (
          <div className="rounded-3xl border border-white/10 bg-[#111] p-10 text-center text-gray-400">
            {selectedUserId ? "No bookings found for this user." : "No bookings found."}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking) => (
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
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex-1 space-y-5">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h2 className="text-3xl font-bold text-white">
                              Booking #{booking.id}
                            </h2>
                            <p className="mt-2 text-gray-400">
                              {booking.car_brand} {booking.car_model} • {booking.car_plate_number}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <span
                              className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${getStatusStyle(
                                booking.status
                              )}`}
                            >
                              {booking.status}
                            </span>

                            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">
                              €{booking.total_price}
                            </span>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-2xl bg-black/30 p-5">
                            <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                              <User size={14} />
                              Customer
                            </p>
                            <p className="mt-3 text-base text-white">
                              {booking.customer_first_name || ""} {booking.customer_last_name || ""}
                            </p>
                            <p className="mt-1 text-sm text-gray-400">
                              {booking.customer_email || "N/A"}
                            </p>
                            <p className="mt-1 text-sm text-gray-400">
                              User ID: {booking.user_id}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-black/30 p-5">
                            <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                              <CarFront size={14} />
                              Car Info
                            </p>
                            <p className="mt-3 text-base text-white">
                              {booking.car_brand || ""} {booking.car_model || ""}
                            </p>
                            <p className="mt-1 text-sm text-gray-400">
                              Plate: {booking.car_plate_number || "N/A"}
                            </p>
                            <p className="mt-1 text-sm text-gray-400">
                              Car ID: {booking.car_id}
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
                              Payment
                            </p>
                            <p className="mt-3 text-sm capitalize text-white">
                              {booking.payment_method || "cash"}
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

                      <div className="flex flex-wrap gap-3 xl:w-[260px] xl:flex-col">
                        {!["booked", "cancelled"].includes(booking.status) && (
                          <button
                            onClick={() => handleComplete(booking.id)}
                            className="rounded-2xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
                          >
                            Confirm Booking
                          </button>
                        )}

                        {!["cancelled"].includes(booking.status) && (
                          <button
                            onClick={() => handleCancel(booking.id)}
                            className="rounded-2xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"
                          >
                            Cancel Booking
                          </button>
                        )}

                        {user?.role === "admin" && (
                          <>
                            <button
                              onClick={() => openEditForm(booking)}
                              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white hover:border-white/30"
                            >
                              <Pencil size={16} />
                              Edit Booking
                            </button>

                            <button
                              onClick={() => handleDeleteBooking(booking.id)}
                              className="flex items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 font-semibold text-red-400 hover:bg-red-500/20"
                            >
                              <Trash2 size={16} />
                              Delete Booking
                            </button>
                          </>
                        )}
                      </div>
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