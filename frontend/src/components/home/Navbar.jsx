import { Link, useNavigate } from "react-router-dom";
import {
  CarFront,
  LayoutDashboard,
  LogIn,
  LogOut,
  Shield,
  UserPlus,
  ClipboardList,
  Users,
  House,
} from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role;

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  function getDashboardPath() {
    if (!user) return "/";
    if (role === "admin") return "/admin-dashboard";
    if (role === "staff") return "/staff-dashboard";
    return "/customer-dashboard";
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/55 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3 transition hover:opacity-90">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff5f00] shadow-[0_10px_30px_rgba(255,95,0,0.25)]">
            <CarFront size={24} className="text-white" />
          </div>

          <div>
            <h1 className="text-xl font-black tracking-tight text-white">AutoLuxe</h1>
            <p className="text-xs text-gray-400">Premium Car Rental</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            to="/cars"
            className="text-sm font-semibold text-gray-200 transition hover:text-[#ff8a3d]"
          >
            Cars
          </Link>

          <Link
            to="/why-us"
            className="text-sm font-semibold text-gray-200 transition hover:text-[#ff8a3d]"
          >
            Why Us
          </Link>

          <Link
            to="/contact"
            className="text-sm font-semibold text-gray-200 transition hover:text-[#ff8a3d]"
          >
            Contact Us
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-right lg:block">
                <p className="text-sm font-bold text-white">
                  Welcome back, {user.first_name || user.email?.split("@")[0] || "User"}
                </p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>

              <Link
                to="/"
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-[#ff5f00]/40 hover:bg-white/10"
              >
                <House size={16} />
                Home
              </Link>

              {role === "admin" && (
                <Link
                  to="/admin-cars"
                  className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-[#ff5f00]/40 hover:bg-white/10 md:flex"
                >
                  <Shield size={16} />
                  Admin Cars
                </Link>
              )}

              {role === "admin" && (
                <Link
                  to="/users"
                  className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-[#ff5f00]/40 hover:bg-white/10 md:flex"
                >
                  <Users size={16} />
                  Users
                </Link>
              )}

              {(role === "admin" || role === "staff") && (
                <Link
                  to="/bookings"
                  className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-[#ff5f00]/40 hover:bg-white/10 md:flex"
                >
                  <ClipboardList size={16} />
                  Bookings
                </Link>
              )}

              {role === "customer" && (
                <Link
                  to="/my-bookings"
                  className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-[#ff5f00]/40 hover:bg-white/10 md:flex"
                >
                  <ClipboardList size={16} />
                  My Bookings
                </Link>
              )}

              <Link
                to={getDashboardPath()}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-[#ff5f00]/40 hover:bg-white/10"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-2xl bg-[#ff5f00] px-4 py-3 text-sm font-bold text-white transition hover:scale-105 hover:bg-[#e55500]"
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
              >
                <LogIn size={16} />
                Login
              </Link>

              <Link
                to="/register"
                className="flex items-center gap-2 rounded-2xl bg-[#ff5f00] px-4 py-3 text-sm font-bold text-white transition hover:scale-105 hover:bg-[#e55500]"
              >
                <UserPlus size={16} />
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}