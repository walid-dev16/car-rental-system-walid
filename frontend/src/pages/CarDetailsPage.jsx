import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import API from "../api/api.js";
import Navbar from "../components/home/Navbar.jsx";
import Footer from "../components/home/Footer.jsx";

import { describeCarBranches } from "../booking/branches.js";
import { withSearch } from "../booking/bookingNavigation.js";
import BookingAccountDialog from "../components/BookingAccountDialog.jsx";
import { getSessionUser } from "../auth/session.js";

export default function CarDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const user = getSessionUser();
  const target = withSearch(`/booking/${id}`, params);
  const pickup = params.get("pickupDate");
  const dropoff = params.get("returnDate");

  const [car, setCar] = useState(null);
  const [error, setError] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [openSection, setOpenSection] = useState({
    technical: true,
    safety: false,
    performance: false,
  });

  useEffect(() => {
    let current = true;
    async function loadCar() {
      setCar(null);
      setError("");
      try {
        const { data } = await API.get(`/cars/${id}`, {
          params: { pickup_datetime: pickup || undefined, return_datetime: dropoff || undefined },
        });
        if (current) setCar(data);
      } catch (err) {
        if (current) setError(err.response?.data?.message || "Failed to load car details.");
      }
    }
    loadCar();
    return () => { current = false; };
  }, [id, pickup, dropoff]);

  function toggleSection(section) {
    setOpenSection((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }

  /* Require login before continuing to the booking page */
  function handleBookNow() {
    if (!user) {
      setShowLogin(true);
      return;
    }

    navigate(target);
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="mx-auto max-w-7xl px-6 py-20">
          <p className={error ? "text-red-400" : "text-gray-400"}>
            {error || "Loading car details..."}
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {showLogin && <BookingAccountDialog target={target} onClose={() => setShowLogin(false)} />}

      <section className="mx-auto max-w-[1500px] px-6 py-10">
        {error && (
          <div className="mb-6 rounded-lg border border-red-500 bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        )}

        <div className="mb-6">
          <Link
            to={withSearch("/cars", params)}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white hover:border-white/30"
          >
            ← Back to Cars
          </Link>
        </div>

        <article className="rounded-[32px] bg-[#1a1a1a] p-6 shadow-2xl">
          <div className="mb-6">
            <h1 className="text-4xl font-black text-white md:text-5xl">
              {car.brand} {car.model}
            </h1>
            <p className="mt-2 text-gray-400">
              {car.production_year} • {car.category} • {car.transmission} • {car.fuel_type}
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <div className="overflow-hidden rounded-3xl bg-[#111]">
                {car.image_url ? (
                  <img
                    src={car.image_url}
                    alt={`${car.brand} ${car.model}`}
                    className="h-[420px] w-full object-cover"
                  />
                ) : (
                  <div className="flex h-[420px] items-center justify-center text-gray-500">
                    No image available
                  </div>
                )}
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl bg-[#222] p-4">
                  <p className="text-sm text-gray-500">Transmission</p>
                  <p className="mt-1 font-semibold capitalize text-white">{car.transmission}</p>
                </div>

                <div className="rounded-2xl bg-[#222] p-4">
                  <p className="text-sm text-gray-500">Doors</p>
                  <p className="mt-1 font-semibold text-white">{car.doors || "N/A"}</p>
                </div>

                <div className="rounded-2xl bg-[#222] p-4">
                  <p className="text-sm text-gray-500">Seats</p>
                  <p className="mt-1 font-semibold text-white">{car.seats}</p>
                </div>

                <div className="rounded-2xl bg-[#222] p-4">
                  <p className="text-sm text-gray-500">Fuel</p>
                  <p className="mt-1 font-semibold capitalize text-white">{car.fuel_type}</p>
                </div>
              </div>

              <div className="mt-6 rounded-3xl bg-[#222] p-5">
                <h3 className="text-lg font-bold text-white">Description</h3>
                <p className="mt-3 text-sm leading-7 text-gray-300">
                  {car.description ||
                    "No description provided."}
                </p>
              </div>

              <div className="mt-4 rounded-3xl bg-[#222] p-5">
                <h3 className="text-lg font-bold text-white">Available in branches</h3>
                <p className="mt-3 text-sm leading-7 text-gray-300">
                  {describeCarBranches(car.available_branches)}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-3xl bg-[#222] p-5">
                <div>
                  <p className="text-sm text-gray-500">Starting from</p>
                  <p className="mt-1 text-3xl font-black text-[#ff5f00]">
                    €{car.daily_price}
                    <span className="ml-1 text-base font-medium text-gray-400">/ day</span>
                  </p>
                </div>

                <button
                  onClick={handleBookNow}
                  disabled={car.operational_status === "maintenance" || car.status === "maintenance"}
                  className="rounded-2xl bg-[#ff5f00] px-8 py-4 font-bold text-white hover:bg-[#e55500]"
                >
                  Book Now
                </button>
              </div>
            </div>

            <div className="rounded-3xl bg-[#222] p-6">
              <h3 className="mb-6 text-4xl font-black text-[#ff5f00]">
                Specifications
              </h3>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => toggleSection("technical")}
                    className="flex w-full items-center justify-between px-5 py-4 text-left text-lg font-semibold text-white"
                  >
                    <span>Technical Ausstattung</span>
                    <span>{openSection.technical ? "−" : "+"}</span>
                  </button>

                  {openSection.technical && (
                    <div className="px-5 pb-5 text-sm leading-7 text-gray-300">
                      {car.technical_specifications ||
                        "Technical specifications have not been provided."}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => toggleSection("safety")}
                    className="flex w-full items-center justify-between px-5 py-4 text-left text-lg font-semibold text-white"
                  >
                    <span>Sicherheit</span>
                    <span>{openSection.safety ? "−" : "+"}</span>
                  </button>

                  {openSection.safety && (
                    <div className="px-5 pb-5 text-sm leading-7 text-gray-300">
                      {car.safety_features ||
                        "Safety features have not been provided."}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => toggleSection("performance")}
                    className="flex w-full items-center justify-between px-5 py-4 text-left text-lg font-semibold text-white"
                  >
                    <span>Leistung & Geschwindigkeit</span>
                    <span>{openSection.performance ? "−" : "+"}</span>
                  </button>

                  {openSection.performance && (
                    <div className="px-5 pb-5 text-sm leading-7 text-gray-300">
                      {car.performance_info ||
                        "Performance details have not been provided."}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 rounded-3xl bg-black/30 p-5">
                <p className="text-sm text-gray-500">Car details</p>
                <div className="mt-3 space-y-2 text-sm text-gray-300">
                  <p>Year: {car.production_year}</p>
                  <p>Category: {car.category}</p>
                  <p>Plate Number: {car.plate_number}</p>
                  <p>Status: {car.status}</p>
                </div>
              </div>
            </div>
          </div>
        </article>
      </section>

      <Footer />
    </div>
  );
}