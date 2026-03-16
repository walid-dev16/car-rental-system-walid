import { Link, useNavigate } from "react-router-dom";
import {
  Home,
  LogOut,
  CarFront,
  LayoutDashboard,
  ClipboardList,
  Users,
} from "lucide-react";
import BrandLogo from "./BrandLogo.jsx";

export default function DashboardHeader({ title }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const roleLabel =
    user?.role === "admin"
      ? "Admin"
      : user?.role === "staff"
      ? "Staff"
      : "Customer";

  const getDashboardPath = () => {
    if (user?.role === "admin") return "/admin-dashboard";
    if (user?.role === "staff") return "/staff-dashboard";
    return "/customer-dashboard";
  };

  return (
    <div className="mb-8 rounded-2xl border border-white/10 bg-[#111] px-6 py-4 shadow-lg">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <BrandLogo size="sm" />

          <div>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="mt-1 text-sm text-gray-400">
              {user?.email || "Logged in user"} • {roleLabel}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-white hover:border-gray-500"
          >
            <Home size={16} />
            Home
          </Link>

          {user?.role === "customer" && (
            <>
              <Link
                to="/cars"
                className="flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-white hover:border-gray-500"
              >
                <CarFront size={16} />
                Browse Cars
              </Link>

              <Link
                to="/my-bookings"
                className="flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-white hover:border-gray-500"
              >
                <ClipboardList size={16} />
                My Bookings
              </Link>
            </>
          )}

          {(user?.role === "admin" || user?.role === "staff") && (
            <Link
              to="/bookings"
              className="flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-white hover:border-gray-500"
            >
              <ClipboardList size={16} />
              Bookings
            </Link>
          )}

          {user?.role === "admin" && (
            <Link
              to="/admin-cars"
              className="flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-white hover:border-gray-500"
            >
              <CarFront size={16} />
              Admin Cars
            </Link>
          )}

          {user?.role === "admin" && (
            <Link
              to="/users"
              className="flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-white hover:border-gray-500"
            >
              <Users size={16} />
              Users
            </Link>
          )}

          <Link
            to={getDashboardPath()}
            className="flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-white hover:border-gray-500"
          >
            <LayoutDashboard size={16} />
            Dashboard
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}