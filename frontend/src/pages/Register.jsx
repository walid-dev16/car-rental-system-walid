import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { bookingAuthLink, getBookingReturnTo } from "../booking/bookingNavigation.js";
import { register as registerApi } from "../api/api.js";
import { UserPlus, Car, Eye, EyeOff } from "lucide-react";
import { BRAND_NAME, BRAND_TAGLINE } from "../config/brand.js";
import Navbar from "../components/home/Navbar.jsx";
import Footer from "../components/home/Footer.jsx";

function PasswordField({ name, label, visibilityLabel, ...inputProps }) {
  const [visible, setVisible] = useState(false);
  const id = `registration-${name}`;
  return (
    <>
      <label htmlFor={id} className="block text-xs font-semibold text-gray-400 uppercase mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          {...inputProps}
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          required
          className="w-full bg-[#222] border border-gray-700 text-white p-3 pr-12 rounded-lg focus:outline-none focus:border-[#ff5f00]"
        />
        <button
          type="button"
          aria-label={`${visible ? "Hide" : "Show"} ${visibilityLabel}`}
          aria-controls={id}
          onClick={() => setVisible(!visible)}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-lg text-gray-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff5f00]"
        >
          {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
        </button>
      </div>
    </>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = getBookingReturnTo(params);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });

  const [confirmation, setConfirmation] = useState("");
  const [checkedConfirmation, setCheckedConfirmation] = useState(false);
  const mismatch = checkedConfirmation && confirmation !== formData.password;

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => navigate(returnTo ? bookingAuthLink("/login", returnTo) : "/login"), 1500);
    return () => clearTimeout(timer);
  }, [success, returnTo, navigate]);

  function handleChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setCheckedConfirmation(true);
    if (confirmation !== formData.password) {
      e.currentTarget.elements.namedItem("password_confirmation").focus();
      return;
    }
    setLoading(true);

    try {
      await registerApi(formData);
      setSuccess("Registration request received. You can now try signing in.");

    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-10">
        <div className="max-w-md w-full bg-[#111] p-8 rounded-2xl border border-gray-800 shadow-2xl">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <div className="bg-[#ff5f00] p-3 rounded-xl">
                <Car size={32} color="white" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-white tracking-tight">
              Create Account
            </h2>
            <p className="text-gray-400 mt-2 italic">
              Join {BRAND_NAME} - {BRAND_TAGLINE}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500 text-green-400 p-3 rounded-lg mb-6 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
                First Name
              </label>
              <input
                type="text"
                name="first_name"
                required
                value={formData.first_name}
                onChange={handleChange}
                className="w-full bg-[#222] border border-gray-700 text-white p-3 rounded-lg focus:outline-none focus:border-[#ff5f00]"
                placeholder="Enter your first name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                required
                value={formData.last_name}
                onChange={handleChange}
                className="w-full bg-[#222] border border-gray-700 text-white p-3 rounded-lg focus:outline-none focus:border-[#ff5f00]"
                placeholder="Enter your last name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-[#222] border border-gray-700 text-white p-3 rounded-lg focus:outline-none focus:border-[#ff5f00]"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <PasswordField
                name="password"
                label="Password"
                visibilityLabel="password"
                value={formData.password}
                onChange={handleChange}
                minLength={12}
                aria-describedby="registration-password-help"
                placeholder="••••••••"
              />
              <p id="registration-password-help" className="mt-2 text-sm text-gray-400">
                Use at least 12 characters and up to 72 UTF-8 bytes.
              </p>
            </div>

            <div>
              <PasswordField
                name="password_confirmation"
                label="Confirm password"
                visibilityLabel="password confirmation"
                value={confirmation}
                onChange={e => setConfirmation(e.target.value)}
                placeholder="Re-enter your password"
                aria-invalid={mismatch || undefined}
                aria-describedby={mismatch ? "registration-confirmation-error" : undefined}
              />
              {mismatch && (
                <p id="registration-confirmation-error" role="alert" className="mt-2 text-sm text-red-400">
                  Passwords do not match.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || Boolean(success)}
              className="w-full bg-[#ff5f00] hover:bg-[#e55500] disabled:opacity-60 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                "Creating account..."
              ) : (
                <>
                  <UserPlus size={20} /> Register
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
