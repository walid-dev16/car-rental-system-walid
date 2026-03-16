import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAvailableCars, fetchMyBookings } from "../api/api.js";
import DashboardHeader from "../components/DashboardHeader.jsx";
import {
  Fuel,
  CalendarDays,
  Armchair,
  BadgeCheck,
  CarFront,
  ClipboardList,
  Clock3,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [cars, setCars] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const [carsRes, bookingsRes] = await Promise.all([
        fetchAvailableCars(),
        fetchMyBookings(),
      ]);

      setCars(carsRes.data || []);
      setMyBookings(bookingsRes.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error]);

  const stats = useMemo(() => {
    const total = myBookings.length;
    const pending = myBookings.filter((b) => b.status === "pending").length;
    const booked = myBookings.filter((b) => b.status === "booked").length;
    const cancelled = myBookings.filter((b) => b.status === "cancelled").length;

    return { total, pending, booked, cancelled };
  }, [myBookings]);

  const latestBooking = useMemo(() => {
    if (!myBookings.length) return null;
    return myBookings[0];
  }, [myBookings]);

  const featuredCars = useMemo(() => {
    return cars.slice(0, 6);
  }, [cars]);

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

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <DashboardHeader title="Customer Dashboard" />

      <section className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-r from-[#111] to-[#1a1a1a] p-8 shadow-xl">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#ff5f00]">
              Welcome back
            </p>
            <h2 className="text-4xl font-black text-white">
              {user?.first_name || "Customer"}, ready for your next ride?
            </h2>
            <p className="mt-3 max-w-2xl text-gray-400">
              Manage your reservations, browse premium vehicles, and book your next
              car in just a few clicks.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/cars")}
              className="rounded-2xl bg-[#ff5f00] px-5 py-3 font-bold text-white transition hover:bg-[#e55500]"
            >
              Browse Cars
            </button>

            <button
              onClick={() => navigate("/my-bookings")}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
            >
              My Bookings
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-[#111] p-10 text-center text-gray-400">
          Loading dashboard...
        </div>
      ) : (
        <>
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
              <h3 className="text-2xl font-black text-white">Latest Booking</h3>
              <button
                onClick={() => navigate("/my-bookings")}
                className="flex items-center gap-2 text-sm font-semibold text-[#ff8a3d] transition hover:text-[#ff5f00]"
              >
                View all bookings
                <ArrowRight size={16} />
              </button>
            </div>

            {latestBooking ? (
              <article className="overflow-hidden rounded-3xl border border-white/10 bg-[#111] shadow-xl">
                <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr]">
                  <div className="h-72 bg-[#1b1b1b] lg:h-full">
                    {latestBooking.car_image_url ? (
                      <img
                        src={latestBooking.car_image_url}
                        alt={`${latestBooking.car_brand} ${latestBooking.car_model}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-500">
                        No image available
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h4 className="text-3xl font-bold text-white">
                            {latestBooking.car_brand} {latestBooking.car_model}
                          </h4>
                          <p className="mt-2 text-gray-400">
                            Booking #{latestBooking.id} • Plate: {latestBooking.car_plate_number}
                          </p>
                        </div>

                        <span
                          className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${getStatusStyle(
                            latestBooking.status
                          )}`}
                        >
                          {latestBooking.status}
                        </span>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl bg-black/30 p-5">
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Pick-up
                          </p>
                          <p className="mt-3 text-sm text-white">
                            {formatDateTime(latestBooking.pickup_datetime)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-black/30 p-5">
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Return
                          </p>
                          <p className="mt-3 text-sm text-white">
                            {formatDateTime(latestBooking.return_datetime)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-black/30 p-5">
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Total
                          </p>
                          <p className="mt-3 text-2xl font-black text-[#ff5f00]">
                            €{latestBooking.total_price}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => navigate("/my-bookings")}
                          className="rounded-2xl bg-[#ff5f00] px-5 py-3 font-bold text-white transition hover:bg-[#e55500]"
                        >
                          Open My Bookings
                        </button>

                        <button
                          onClick={() => navigate("/cars")}
                          className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
                        >
                          Book Another Car
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-[#111] p-10 text-center">
                <CarFront size={34} className="mx-auto text-[#ff5f00]" />
                <h4 className="mt-4 text-2xl font-bold text-white">No bookings yet</h4>
                <p className="mt-3 text-gray-400">
                  Start by browsing our premium fleet and reserve your first car.
                </p>
                <button
                  onClick={() => navigate("/cars")}
                  className="mt-6 rounded-2xl bg-[#ff5f00] px-6 py-3 font-bold text-white transition hover:bg-[#e55500]"
                >
                  Browse Cars
                </button>
              </div>
            )}
          </section>

          <section>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-2xl font-black text-white">Recommended Cars</h3>
              <button
                onClick={() => navigate("/cars")}
                className="flex items-center gap-2 text-sm font-semibold text-[#ff8a3d] transition hover:text-[#ff5f00]"
              >
                Browse all cars
                <ArrowRight size={16} />
              </button>
            </div>

            {featuredCars.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#111] p-8 text-center text-gray-400">
                No available cars right now.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                {featuredCars.map((car) => (
                  <div
                    key={car.id}
                    className="overflow-hidden rounded-3xl border border-white/10 bg-[#111] shadow-xl transition hover:-translate-y-1 hover:border-white/20"
                  >
                    <div className="h-56 w-full bg-[#1b1b1b]">
                      {car.image_url ? (
                        <img
                          src={car.image_url}
                          alt={`${car.brand} ${car.model}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-500">
                          No image available
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-2xl font-bold text-white">
                            {car.brand} {car.model}
                          </h4>
                          <p className="mt-1 text-sm text-gray-400">
                            Plate: {car.plate_number}
                          </p>
                        </div>

                        <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                          Available
                        </span>
                      </div>

                      <div className="mb-5 grid grid-cols-2 gap-3 text-sm text-gray-300">
                        <div className="rounded-xl bg-black/40 p-3">
                          <div className="mb-1 flex items-center gap-2 text-gray-400">
                            <CalendarDays size={15} />
                            Year
                          </div>
                          <p className="font-semibold text-white">{car.production_year}</p>
                        </div>

                        <div className="rounded-xl bg-black/40 p-3">
                          <div className="mb-1 flex items-center gap-2 text-gray-400">
                            <Armchair size={15} />
                            Seats
                          </div>
                          <p className="font-semibold text-white">{car.seats}</p>
                        </div>

                        <div className="rounded-xl bg-black/40 p-3">
                          <div className="mb-1 flex items-center gap-2 text-gray-400">
                            <Fuel size={15} />
                            Fuel
                          </div>
                          <p className="font-semibold text-white capitalize">{car.fuel_type}</p>
                        </div>

                        <div className="rounded-xl bg-black/40 p-3">
                          <div className="mb-1 flex items-center gap-2 text-gray-400">
                            <BadgeCheck size={15} />
                            Type
                          </div>
                          <p className="font-semibold text-white capitalize">{car.category}</p>
                        </div>
                      </div>

                      <div className="mb-4 flex items-end justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Starting from</p>
                          <p className="text-2xl font-bold text-[#ff5f00]">
                            €{car.daily_price}
                            <span className="ml-1 text-sm text-gray-400">/ day</span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/booking/${car.id}`)}
                        className="w-full rounded-xl bg-[#ff5f00] py-3 font-bold text-white transition hover:bg-[#e55500]"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}