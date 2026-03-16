import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, MapPin } from "lucide-react";
import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import TimePicker from "./TimePicker.jsx";

const CITY_OPTIONS = ["Erfurt", "Berlin", "Frankfurt", "Munich", "Hamburg"];

export default function HeroSection() {
  const navigate = useNavigate();

  const [pickupCity, setPickupCity] = useState("Erfurt");
  const [dropoffCity, setDropoffCity] = useState("Erfurt");
  const [pickupDate, setPickupDate] = useState(null);
  const [returnDate, setReturnDate] = useState(null);
  const [pickupTime, setPickupTime] = useState("12:00");
  const [returnTime, setReturnTime] = useState("12:00");

  const handleSearchCars = () => {
    const params = new URLSearchParams();

    if (pickupCity) params.set("city", pickupCity);
    if (dropoffCity) params.set("dropoffCity", dropoffCity);

    if (pickupDate) {
      const [pickupHour, pickupMinute] = pickupTime.split(":");
      const pickupDateTime = new Date(pickupDate);
      pickupDateTime.setHours(Number(pickupHour), Number(pickupMinute), 0, 0);
      params.set("pickupDate", pickupDateTime.toISOString());
    }

    if (returnDate) {
      const [returnHour, returnMinute] = returnTime.split(":");
      const returnDateTime = new Date(returnDate);
      returnDateTime.setHours(Number(returnHour), Number(returnMinute), 0, 0);
      params.set("returnDate", returnDateTime.toISOString());
    }

    navigate(`/cars?${params.toString()}`);
  };

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80"
          alt="Luxury car"
          className="h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/55 to-black/25" />
      </div>

      <div className="relative mx-auto grid min-h-[88vh] max-w-[1500px] items-center gap-10 px-6 py-14 lg:grid-cols-[1fr_760px]">
        <div className="max-w-2xl">
          <p className="mb-4 inline-block rounded-full border border-[#ff5f00]/30 bg-[#ff5f00]/10 px-4 py-1 text-sm font-semibold text-[#ff8a3d]">
            Premium mobility for every journey
          </p>

          <h2 className="mb-6 text-5xl font-black leading-tight text-white md:text-6xl">
            Rent your dream car
            <span className="block text-[#ff5f00]">fast, simple, premium.</span>
          </h2>

          <p className="mb-8 max-w-xl text-lg leading-8 text-gray-200">
            Browse premium cars, compare prices, and book in minutes. Clean
            design, smooth experience, and reliable service for business and
            leisure trips.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              to="/cars"
              className="rounded-2xl bg-[#ff5f00] px-6 py-3 font-bold text-white transition hover:scale-105 hover:bg-[#e55500]"
            >
              Book Now
            </Link>

            <a
              href="#featured"
              className="rounded-2xl border border-white/15 px-6 py-3 font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
            >
              Explore Cars
            </a>
          </div>
        </div>

        <div className="justify-self-end rounded-[34px] border border-white/20 bg-white/12 p-7 shadow-2xl backdrop-blur-2xl">
          <h3 className="mb-6 text-3xl font-bold text-white">Quick Booking</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-[#111]/85 p-4">
              <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-300">
                <MapPin size={16} />
                Pick-up Location
              </label>
              <select
                value={pickupCity}
                onChange={(e) => setPickupCity(e.target.value)}
                className="w-full rounded-2xl border border-white/5 bg-[#2a2a2a] px-4 py-4 text-base text-white outline-none"
              >
                {CITY_OPTIONS.map((city) => (
                  <option key={city} value={city} className="bg-[#1c1c1c]">
                    {city}, Germany
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#111]/85 p-4">
              <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-300">
                <MapPin size={16} />
                Drop-off Location
              </label>
              <select
                value={dropoffCity}
                onChange={(e) => setDropoffCity(e.target.value)}
                className="w-full rounded-2xl border border-white/5 bg-[#2a2a2a] px-4 py-4 text-base text-white outline-none"
              >
                {CITY_OPTIONS.map((city) => (
                  <option key={city} value={city} className="bg-[#1c1c1c]">
                    {city}, Germany
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#111]/85 p-4">
              <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-300">
                <CalendarDays size={16} />
                Pick-up Date
              </label>

              <div className="grid grid-cols-[1fr_140px] gap-3">
                <div className="rounded-2xl border border-white/5 bg-[#2a2a2a] px-4 py-1">
                  <DatePicker
                    selected={pickupDate}
                    onChange={(date) => setPickupDate(date)}
                    selectsStart
                    startDate={pickupDate}
                    endDate={returnDate}
                    minDate={new Date()}
                    placeholderText="Select pickup date"
                    dateFormat="dd/MM/yyyy"
                    className="w-full bg-transparent py-3 text-base text-white outline-none placeholder:text-gray-400"
                    calendarClassName="!border !border-gray-200 !rounded-3xl !shadow-2xl"
                    popperPlacement="bottom-start"
                  />
                </div>

                <TimePicker
                  title="Select pickup time"
                  label="Pickup time"
                  value={pickupTime}
                  onChange={setPickupTime}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#111]/85 p-4">
              <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-300">
                <CalendarDays size={16} />
                Return Date
              </label>

              <div className="grid grid-cols-[1fr_140px] gap-3">
                <div className="rounded-2xl border border-white/5 bg-[#2a2a2a] px-4 py-1">
                  <DatePicker
                    selected={returnDate}
                    onChange={(date) => setReturnDate(date)}
                    selectsEnd
                    startDate={pickupDate}
                    endDate={returnDate}
                    minDate={pickupDate || new Date()}
                    placeholderText="Select return date"
                    dateFormat="dd/MM/yyyy"
                    className="w-full bg-transparent py-3 text-base text-white outline-none placeholder:text-gray-400"
                    calendarClassName="!border !border-gray-200 !rounded-3xl !shadow-2xl"
                    popperPlacement="bottom-start"
                  />
                </div>

                <TimePicker
                  title="Select return time"
                  label="Return time"
                  value={returnTime}
                  onChange={setReturnTime}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSearchCars}
            className="mt-6 block w-full rounded-2xl bg-[#ff5f00] px-6 py-4 text-center text-lg font-bold text-white transition hover:scale-[1.01] hover:bg-[#e55500]"
          >
            Search Available Cars
          </button>

          <p className="mt-3 text-center text-xs text-gray-300">
            You can browse first. Login is required only before final booking.
          </p>
        </div>
      </div>
    </section>
  );
}