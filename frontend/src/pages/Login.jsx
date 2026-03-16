import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login as loginApi } from "../api/api.js";
import { LogIn, Car } from "lucide-react";
import { BRAND_NAME, BRAND_TAGLINE } from "../config/brand.js";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const expiredMessage = localStorage.getItem("session_expired_message");

    if (expiredMessage) {
      setError(expiredMessage);
      localStorage.removeItem("session_expired_message");
    }
  }, []);

  function handleChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await loginApi(formData);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
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
            {BRAND_NAME}
          </h2>
          <p className="text-gray-400 mt-2 italic">{BRAND_TAGLINE}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
              "Processing..."
            ) : (
              <>
                <LogIn size={20} /> Sign In
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}