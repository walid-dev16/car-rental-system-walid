import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register as registerApi } from "../api/api.js";
import { UserPlus, Car } from "lucide-react";
import { BRAND_NAME, BRAND_TAGLINE } from "../config/brand.js";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await registerApi(formData);
      setSuccess("Account created successfully. Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
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
            <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-[#222] border border-gray-700 text-white p-3 rounded-lg focus:outline-none focus:border-[#ff5f00]"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
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
  );
}