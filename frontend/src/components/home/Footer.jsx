import { Link } from "react-router-dom";
import { CarFront, Mail, Phone, MapPin, Instagram, Facebook, ShieldCheck } from "lucide-react";

export default function Footer() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  function getDashboardPath() {
    if (!user) return "/login";
    if (user.role === "admin") return "/admin-dashboard";
    if (user.role === "staff") return "/staff-dashboard";
    return "/customer-dashboard";
  }

  return (
    <footer className="mt-16 border-t border-white/10 bg-gradient-to-b from-[#0a0a0a] to-black">
      <div className="mx-auto max-w-[1500px] px-6 py-14">
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff5f00] shadow-[0_10px_30px_rgba(255,95,0,0.25)]">
                <CarFront size={24} className="text-white" />
              </div>

              <div>
                <h2 className="text-xl font-black tracking-tight text-white">AutoLuxe</h2>
                <p className="text-xs text-gray-400">Premium Car Rental</p>
              </div>
            </div>

            <p className="mt-5 max-w-sm text-sm leading-7 text-gray-400">
              Premium car rental experience with elegant vehicles, fast booking,
              and reliable service for business and leisure journeys.
            </p>

            <div className="mt-5 flex gap-3">
              <a
                href="#"
                className="rounded-xl border border-white/10 bg-white/5 p-3 text-gray-300 transition hover:border-white/30 hover:text-white"
              >
                <Instagram size={18} />
              </a>
              <a
                href="#"
                className="rounded-xl border border-white/10 bg-white/5 p-3 text-gray-300 transition hover:border-white/30 hover:text-white"
              >
                <Facebook size={18} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">Quick Links</h3>
            <div className="mt-5 space-y-3 text-sm text-gray-400">
              <Link to="/" className="block transition hover:text-white">
                Home
              </Link>
              <Link to="/cars" className="block transition hover:text-white">
                Cars
              </Link>
              <Link to="/why-us" className="block transition hover:text-white">
                Why Us
              </Link>
              <Link to="/contact" className="block transition hover:text-white">
                Contact Us
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">Account</h3>
            <div className="mt-5 space-y-3 text-sm text-gray-400">
              {user ? (
                <>
                  <Link to={getDashboardPath()} className="block transition hover:text-white">
                    Dashboard
                  </Link>
                  {user.role === "customer" && (
                    <Link to="/my-bookings" className="block transition hover:text-white">
                      My Bookings
                    </Link>
                  )}
                  {(user.role === "admin" || user.role === "staff") && (
                    <Link to="/bookings" className="block transition hover:text-white">
                      Bookings
                    </Link>
                  )}
                  {user.role === "admin" && (
                    <Link to="/users" className="block transition hover:text-white">
                      Users
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link to="/login" className="block transition hover:text-white">
                    Login
                  </Link>
                  <Link to="/register" className="block transition hover:text-white">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">Contact</h3>
            <div className="mt-5 space-y-4 text-sm text-gray-400">
              <div className="flex items-start gap-3">
                <Mail size={18} className="mt-0.5 text-[#ff5f00]" />
                <span>support@autoluxe-rental.com</span>
              </div>

              <div className="flex items-start gap-3">
                <Phone size={18} className="mt-0.5 text-[#ff5f00]" />
                <span>+49 157 0000 0000</span>
              </div>

              <div className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 text-[#ff5f00]" />
                <span>Erfurt, Germany</span>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 text-white">
                  <ShieldCheck size={18} className="text-[#ff5f00]" />
                  <span className="font-semibold">Trusted Booking</span>
                </div>
                <p className="mt-2 text-xs leading-6 text-gray-400">
                  Secure reservation flow, premium fleet, and customer-first support.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
          <p>© 2026 AutoLuxe Premium Car Rental. All rights reserved.</p>

          <div className="flex flex-wrap gap-5">
            <Link to="/" className="transition hover:text-white">
              Home
            </Link>
            <Link to="/cars" className="transition hover:text-white">
              Cars
            </Link>
            <Link to="/contact" className="transition hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}