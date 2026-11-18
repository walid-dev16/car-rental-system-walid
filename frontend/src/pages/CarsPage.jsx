import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchAvailableCars } from "../api/api.js";
import Navbar from "../components/home/Navbar.jsx";
import Footer from "../components/home/Footer.jsx";

import { BRANCHES, describeCarBranches } from "../booking/branches.js";
import { branchTimeInput, formatBranchTime, rentalPeriod } from "../booking/time.js";
import { withSearch } from "../booking/bookingNavigation.js";
import BookingAccountDialog from "../components/BookingAccountDialog.jsx";
import { getSessionUser } from "../auth/session.js";

export default function CarsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = getSessionUser();
  const [result, setResult] = useState(null);
  const [bookingTarget, setBookingTarget] = useState("");

  const city = searchParams.get("city") || "";
  const dropoffCity = searchParams.get("dropoffCity") || "";
  const pickupDate = branchTimeInput(searchParams.get("pickupDate"));
  const returnDate = branchTimeInput(searchParams.get("returnDate"));
  const [filters, setFilters] = useState({
    category: "", transmission: "", fuel_type: "", seats: "", maxPrice: "",
  });

  const query = useMemo(() => ({
    pickup_datetime: pickupDate || undefined, return_datetime: returnDate || undefined,
    pickup_branch: city || undefined, dropoff_branch: dropoffCity || undefined,
  }), [city, dropoffCity, pickupDate, returnDate]);
  const invalidDate = (searchParams.has("pickupDate") && !pickupDate) || (searchParams.has("returnDate") && !returnDate);
  const dateError = invalidDate ? "Choose valid rental dates." :
    pickupDate || returnDate ? rentalPeriod(pickupDate, returnDate).error : "";
  const currentResult = result?.query === query ? result : null;
  const loading = !dateError && !currentResult;
  const error = dateError || currentResult?.error;
  useEffect(() => {
    if (dateError) return;
    let current = true;
    fetchAvailableCars(query).then(({ data }) => {
      if (current) setResult({ query, cars: data });
    }).catch((err) => {
      if (current) setResult({ query, error: err.response?.data?.message || "Failed to load available cars." });
    });
    return () => { current = false; };
  }, [query, dateError]);

  function handleFilterChange(e) {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function changeSearch(e) {
    const next = new URLSearchParams(searchParams);
    if (e.target.value) next.set(e.target.name, e.target.value);
    else next.delete(e.target.name);
    setSearchParams(next, { replace: true });
  }

  const filteredCars = useMemo(() => {
    return (currentResult?.cars || []).filter((car) => {
      if (filters.category && car.category !== filters.category) return false;
      if (filters.transmission && car.transmission !== filters.transmission) return false;
      if (filters.fuel_type && car.fuel_type !== filters.fuel_type) return false;
      if (filters.seats && String(car.seats) !== filters.seats) return false;
      if (filters.maxPrice && Number(car.daily_price) > Number(filters.maxPrice)) return false;

      return true;
    });
  }, [currentResult, filters]);

  function handleBookNow(carId) {
    const target = withSearch(`/booking/${carId}`, searchParams);
    if (user) navigate(target);
    else setBookingTarget(target);
  }

  function handleViewDetails(carId) {
    navigate(withSearch(`/cars/${carId}`, searchParams));
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="border-b border-white/10 bg-gradient-to-r from-[#0f0f0f] to-[#171717]">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#ff5f00]">
            Featured Fleet
          </p>
          <h1 className="text-4xl font-black text-white md:text-5xl">
            Popular cars for rent
          </h1>
          <p className="mt-3 max-w-3xl text-gray-400">
            Browse premium vehicles, compare categories and prices, and choose the
            perfect car for your next trip.
            {city ? ` Showing results for ${city}.` : ""}
          </p>

          {pickupDate && returnDate && (
            <p className="mt-3 text-sm text-[#ff8a3d]">
              Pickup: {formatBranchTime(pickupDate)} • Return: {formatBranchTime(returnDate)}
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-6 py-10">
        {error && (
          <div className="mb-6 rounded-lg border border-red-500 bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        )}

        {bookingTarget && <BookingAccountDialog target={bookingTarget} onClose={() => setBookingTarget("")} />}

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-3xl border border-white/10 bg-[#111] p-5 shadow-xl">
            <h2 className="mb-5 text-2xl font-bold text-white">Filters</h2>

            <div className="space-y-4">
              {[["city", "Pickup branch", city], ["dropoffCity", "Return branch", dropoffCity]].map(([name, label, value]) => (
                <div key={name}>
                  <label htmlFor={name} className="mb-2 block text-sm text-gray-400">{label}</label>
                  <select id={name} name={name} value={value} onChange={changeSearch} className="w-full rounded-xl bg-[#222] p-3 text-white">
                    <option value="">All branches</option>
                    {BRANCHES.map((branch) => <option key={branch}>{branch}</option>)}
                  </select>
                </div>
              ))}
              {[["pickupDate", "Pickup (Berlin)", pickupDate], ["returnDate", "Return (Berlin)", returnDate]].map(([name, label, value]) => (
                <div key={name}>
                  <label htmlFor={name} className="mb-2 block text-sm text-gray-400">{label}</label>
                  <input id={name} name={name} type="datetime-local" value={value} onChange={changeSearch} className="w-full rounded-xl bg-[#222] p-3 text-white [color-scheme:dark]" />
                </div>
              ))}

              <div>
                <label className="mb-2 block text-sm text-gray-400">Category</label>
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="w-full rounded-xl bg-[#222] p-3 text-white outline-none"
                >
                  <option value="">All categories</option>
                  <option value="economy">economy</option>
                  <option value="sedan">sedan</option>
                  <option value="suv">suv</option>
                  <option value="luxury">luxury</option>
                  <option value="sports">sports</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">Transmission</label>
                <select
                  name="transmission"
                  value={filters.transmission}
                  onChange={handleFilterChange}
                  className="w-full rounded-xl bg-[#222] p-3 text-white outline-none"
                >
                  <option value="">All</option>
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">Fuel Type</label>
                <select
                  name="fuel_type"
                  value={filters.fuel_type}
                  onChange={handleFilterChange}
                  className="w-full rounded-xl bg-[#222] p-3 text-white outline-none"
                >
                  <option value="">All</option>
                  <option value="petrol">petrol</option>
                  <option value="diesel">diesel</option>
                  <option value="hybrid">hybrid</option>
                  <option value="electric">electric</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">Seats</label>
                <select
                  name="seats"
                  value={filters.seats}
                  onChange={handleFilterChange}
                  className="w-full rounded-xl bg-[#222] p-3 text-white outline-none"
                >
                  <option value="">Any</option>
                  <option value="2">2</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">Max Price / day</label>
                <input
                  type="number"
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  placeholder="e.g. 150"
                  className="w-full rounded-xl bg-[#222] p-3 text-white outline-none"
                />
              </div>
            </div>
          </aside>

          <div className="grid gap-6 md:grid-cols-2">
            {loading ? <p>Loading available cars…</p> : error ? null : filteredCars.length === 0 ? (
              <div className="col-span-full rounded-3xl border border-white/10 bg-[#111] p-8 text-center text-gray-400">
                No cars match the current filters.
              </div>
            ) : (
              filteredCars.map((car) => (
                <article
                  key={car.id}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-[#1a1a1a] shadow-xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-[#ff5f00]/40 hover:shadow-[0_20px_60px_rgba(255,95,0,0.18)]"
                >
                  <div className="h-64 w-full bg-[#111]">
                    {car.image_url ? (
                      <img
                        src={car.image_url}
                        alt={`${car.brand} ${car.model}`}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-500">
                        No image available
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          {car.brand} {car.model}
                        </h2>
                        <p className="mt-1 text-sm text-gray-400">
                          {car.production_year} • {car.category} • {car.transmission}
                        </p>
                      </div>

                      <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-gray-300">
                        {car.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-[#222] p-3">
                        <p className="text-xs text-gray-500">Fuel</p>
                        <p className="mt-1 font-semibold capitalize text-white">
                          {car.fuel_type}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#222] p-3">
                        <p className="text-xs text-gray-500">Seats</p>
                        <p className="mt-1 font-semibold text-white">{car.seats}</p>
                      </div>

                      <div className="rounded-2xl bg-[#222] p-3">
                        <p className="text-xs text-gray-500">Doors</p>
                        <p className="mt-1 font-semibold text-white">
                          {car.doors || "N/A"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#222] p-3">
                        <p className="text-xs text-gray-500">Plate</p>
                        <p className="mt-1 font-semibold text-white">
                          {car.plate_number}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm leading-6 text-gray-400">
                      {car.description
                        ? car.description.slice(0, 140) +
                          (car.description.length > 140 ? "..." : "")
                        : ""}
                    </p>

                    <div className="rounded-2xl bg-[#222] p-3">
                      <p className="text-xs text-gray-500">Available in branches</p>
                      <p className="mt-1 text-sm text-gray-300">
                        {describeCarBranches(car.available_branches)}
                      </p>
                    </div>

                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Starting from</p>
                        <p className="text-3xl font-extrabold text-[#ff5f00]">
                          €{car.daily_price}
                          <span className="ml-1 text-sm font-medium text-gray-400">/day</span>
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(car.id)}
                          className="rounded-xl border border-white/10 px-4 py-2 font-semibold text-white transition hover:border-[#ff5f00]/50 hover:bg-white/5"
                        >
                          Details
                        </button>

                        <button
                          onClick={() => handleBookNow(car.id)}
                          className="rounded-xl bg-[#ff5f00] px-4 py-2 font-semibold text-white transition hover:scale-105 hover:bg-[#e55500]"
                        >
                          Book
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}