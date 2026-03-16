import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/home/Navbar.jsx";
import Footer from "../components/home/Footer.jsx";
import API from "../api/api.js";
import {
  Users,
  Mail,
  Phone,
  MapPin,
  Shield,
  CalendarDays,
  ClipboardList,
  Trash2,
  ArrowRight,
} from "lucide-react";

export default function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadUsers = async () => {
    try {
      const { data } = await API.get("/users");
      setUsers(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load users");
    }
  };

  /* Load users once when the page opens */
  useEffect(() => {
    const fetchData = async () => {
      await loadUsers();
    };

    fetchData();
  }, []);

  /* Auto-clear success and error messages after a short delay */
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [error, success]);

  /* Delete selected user, then refresh the list */
  const handleDeleteUser = async (id) => {
    setError("");
    setSuccess("");

    const confirmed = window.confirm(
      "Are you sure you want to delete this user? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      await API.delete(`/users/${id}`);
      await loadUsers();
      setSuccess("User deleted successfully.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete user");
    }
  };

  const formatDate = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getRoleStyle = (role) => {
    if (role === "admin") {
      return "border-red-500/30 bg-red-500/10 text-red-400";
    }
    if (role === "staff") {
      return "border-blue-500/30 bg-blue-500/10 text-blue-400";
    }
    return "border-green-500/30 bg-green-500/10 text-green-400";
  };

  const getStatusStyle = (status) => {
    if (status === "approved" || status === "active") {
      return "border-green-500/30 bg-green-500/10 text-green-400";
    }
    if (status === "pending") {
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";
    }
    if (status === "blocked" || status === "inactive") {
      return "border-red-500/30 bg-red-500/10 text-red-400";
    }
    return "border-white/10 bg-white/5 text-gray-300";
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="border-b border-white/10 bg-gradient-to-r from-[#0f0f0f] to-[#171717]">
        <div className="mx-auto max-w-[1500px] px-6 py-12">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#ff5f00]">
                User Management
              </p>
              <h1 className="text-4xl font-black text-white md:text-5xl">
                All Users
              </h1>
              <p className="mt-3 max-w-3xl text-gray-400">
                View registered users, account roles, contact details, address
                information, and booking history summary.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-lg">
              <div className="flex items-center gap-3">
                <Users className="text-[#ff5f00]" size={20} />
                <div>
                  <p className="text-sm text-gray-400">Total Users</p>
                  <p className="text-3xl font-black text-white">{users.length}</p>
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

        {users.length === 0 && !error ? (
          <div className="rounded-3xl border border-white/10 bg-[#111] p-10 text-center text-gray-400">
            No users found.
          </div>
        ) : (
          <div className="space-y-6">
            {users.map((user) => (
              <article
                key={user.id}
                className="rounded-3xl border border-white/10 bg-[#111] p-6 shadow-xl"
              >
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex-1 space-y-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h2 className="text-3xl font-bold text-white">
                          {user.first_name} {user.last_name}
                        </h2>

                        <div className="mt-3 space-y-2 text-gray-400">
                          <p className="flex items-center gap-2">
                            <Mail size={16} className="text-[#ff5f00]" />
                            {user.email}
                          </p>

                          <p className="flex items-center gap-2">
                            <Phone size={16} className="text-[#ff5f00]" />
                            {user.phone || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <span
                          className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${getRoleStyle(
                            user.role
                          )}`}
                        >
                          {user.role || "N/A"}
                        </span>

                        <span
                          className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${getStatusStyle(
                            user.account_status
                          )}`}
                        >
                          {user.account_status || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl bg-black/30 p-5">
                        <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                          <Shield size={14} />
                          Account Info
                        </p>
                        <p className="mt-3 text-sm text-white">User ID: {user.id}</p>
                        <p className="mt-1 text-sm text-white">
                          Country: {user.country_code || "N/A"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-black/30 p-5">
                        <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                          <MapPin size={14} />
                          Address
                        </p>
                        <p className="mt-3 text-sm text-white">
                          Street: {user.street_address || "N/A"}
                        </p>
                        <p className="mt-1 text-sm text-white">
                          City: {user.city || "N/A"}
                        </p>
                        <p className="mt-1 text-sm text-white">
                          Postal Code: {user.postal_code || "N/A"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-black/30 p-5">
                        <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                          <CalendarDays size={14} />
                          Registration
                        </p>
                        <p className="mt-3 text-sm text-white">
                          Joined: {formatDate(user.created_at)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-black/30 p-5">
                        <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                          <ClipboardList size={14} />
                          Bookings
                        </p>
                        <p className="mt-3 text-sm text-white">
                          Total bookings: {user.total_bookings || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full flex-wrap gap-3 xl:w-[260px] xl:flex-col">
                    <button
                      onClick={() => navigate(`/bookings?userId=${user.id}`)}
                      className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
                    >
                      View Bookings
                      <ArrowRight size={16} />
                    </button>

                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="flex items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 font-semibold text-red-400 transition hover:bg-red-500/20"
                    >
                      <Trash2 size={16} />
                      Delete User
                    </button>
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