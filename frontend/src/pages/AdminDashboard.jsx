import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardSummary } from "../api/api.js";
import DashboardHeader from "../components/DashboardHeader.jsx";
import {
  CarFront,
  ClipboardList,
  CircleCheckBig,
  Car,
  Shield,
  Users,
  ArrowRight,
  Wrench,
  House,
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  /* Load admin dashboard summary when the page opens */
  useEffect(() => {
    async function fetchSummary() {
      try {
        const { data } = await dashboardSummary();
        setSummary(data);
      } catch {
        setError("Failed to load dashboard data");
      }
    }

    fetchSummary();
  }, []);

  if (error) {
    return <div className="min-h-screen bg-black p-10 text-red-500">{error}</div>;
  }

  if (!summary) {
    return <div className="min-h-screen bg-black p-10 text-white">Loading...</div>;
  }

  /* Extract dashboard metrics from API response */
  const totalCars = summary.overview?.total_cars || 0;
  const totalBookings = summary.overview?.total_bookings || 0;
  const totalUsers = summary.overview?.total_users || 0;
  const availableCars = summary.fleet_breakdown?.available || 0;
  const bookedCars = summary.fleet_breakdown?.booked || 0;
  const maintenanceCars = summary.fleet_breakdown?.maintenance || 0;

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <DashboardHeader title="Admin Dashboard" />

      <section className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-r from-[#111] to-[#1a1a1a] p-8 shadow-xl">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#ff5f00]">
              Admin Control Center
            </p>
            <h2 className="text-4xl font-black text-white">
              Manage your fleet, bookings, and users
            </h2>
            <p className="mt-3 max-w-3xl text-gray-400">
              Monitor platform activity, manage reservations, control your fleet,
              and keep everything running smoothly from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/admin-cars")}
              className="rounded-2xl bg-[#ff5f00] px-5 py-3 font-bold text-white transition hover:bg-[#e55500]"
            >
              Manage Cars
            </button>

            <button
              onClick={() => navigate("/bookings")}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
            >
              View Bookings
            </button>

            <button
              onClick={() => navigate("/users")}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
            >
              Manage Users
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

      <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-[#111] p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-400">Total Cars</span>
            <CarFront size={20} className="text-[#ff5f00]" />
          </div>
          <p className="text-4xl font-black text-white">{totalCars}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#111] p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-400">Total Bookings</span>
            <ClipboardList size={20} className="text-[#ff5f00]" />
          </div>
          <p className="text-4xl font-black text-white">{totalBookings}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#111] p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-400">Available Cars</span>
            <CircleCheckBig size={20} className="text-green-400" />
          </div>
          <p className="text-4xl font-black text-white">{availableCars}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#111] p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-400">Booked Cars</span>
            <Car size={20} className="text-yellow-400" />
          </div>
          <p className="text-4xl font-black text-white">{bookedCars}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#111] p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-400">Maintenance</span>
            <Wrench size={20} className="text-red-400" />
          </div>
          <p className="text-4xl font-black text-white">{maintenanceCars}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#111] p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-400">Total Users</span>
            <Users size={20} className="text-blue-400" />
          </div>
          <p className="text-4xl font-black text-white">{totalUsers}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-white/10 bg-[#111] p-6 shadow-xl">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-2xl font-black text-white">Fleet Overview</h3>
            <button
              onClick={() => navigate("/admin-cars")}
              className="flex items-center gap-2 text-sm font-semibold text-[#ff8a3d] transition hover:text-[#ff5f00]"
            >
              Open fleet
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Visual fleet breakdown based on current car status counts */}
          <div className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-400">Available</span>
                <span className="font-semibold text-white">{availableCars}</span>
              </div>
              <div className="h-3 rounded-full bg-black/40">
                <div
                  className="h-3 rounded-full bg-green-500"
                  style={{ width: `${totalCars ? (availableCars / totalCars) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-400">Booked</span>
                <span className="font-semibold text-white">{bookedCars}</span>
              </div>
              <div className="h-3 rounded-full bg-black/40">
                <div
                  className="h-3 rounded-full bg-yellow-500"
                  style={{ width: `${totalCars ? (bookedCars / totalCars) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-400">Maintenance</span>
                <span className="font-semibold text-white">{maintenanceCars}</span>
              </div>
              <div className="h-3 rounded-full bg-black/40">
                <div
                  className="h-3 rounded-full bg-red-500"
                  style={{ width: `${totalCars ? (maintenanceCars / totalCars) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-black/30 p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500">System Status</p>
              <p className="mt-3 text-lg font-bold text-green-400">Operational</p>
            </div>

            <div className="rounded-2xl bg-black/30 p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500">Admin Access</p>
              <p className="mt-3 text-lg font-bold text-white">Full Control</p>
            </div>

            <div className="rounded-2xl bg-black/30 p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500">Platform Scope</p>
              <p className="mt-3 text-lg font-bold text-white">Fleet & Users</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-3xl border border-white/10 bg-[#111] p-6 shadow-xl">
            <h3 className="mb-5 text-2xl font-black text-white">Quick Actions</h3>

            <div className="grid gap-4">
              <button
                onClick={() => navigate("/admin-cars")}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left transition hover:border-[#ff5f00]/40 hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <CarFront size={18} className="text-[#ff5f00]" />
                  <span className="font-semibold text-white">Manage Cars</span>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </button>

              <button
                onClick={() => navigate("/bookings")}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left transition hover:border-[#ff5f00]/40 hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <ClipboardList size={18} className="text-[#ff5f00]" />
                  <span className="font-semibold text-white">Review Bookings</span>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </button>

              <button
                onClick={() => navigate("/users")}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left transition hover:border-[#ff5f00]/40 hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <Users size={18} className="text-[#ff5f00]" />
                  <span className="font-semibold text-white">Manage Users</span>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </button>

              <button
                onClick={() => navigate("/")}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left transition hover:border-[#ff5f00]/40 hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <House size={18} className="text-[#ff5f00]" />
                  <span className="font-semibold text-white">Go to Homepage</span>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#111] p-6 shadow-xl">
            <div className="mb-5 flex items-center gap-3">
              <Shield size={20} className="text-[#ff5f00]" />
              <h3 className="text-2xl font-black text-white">Admin Notes</h3>
            </div>

            <div className="space-y-4 text-sm leading-7 text-gray-300">
              <p className="rounded-2xl bg-black/30 p-4">
                Monitor fleet availability regularly to avoid booking conflicts and
                improve response time for customer reservations.
              </p>

              <p className="rounded-2xl bg-black/30 p-4">
                Review user activity and booking flow frequently to keep the
                platform clean, active, and reliable.
              </p>

              <p className="rounded-2xl bg-black/30 p-4">
                Keep vehicles updated with correct images, pricing, and status for
                a premium customer experience.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}