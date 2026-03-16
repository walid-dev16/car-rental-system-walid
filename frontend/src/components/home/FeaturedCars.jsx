import { Link } from "react-router-dom";
import { Star } from "lucide-react";

export default function FeaturedCars() {
  const featuredCars = [
    {
      id: 9,
      brand: "BMW",
      model: "X5",
      price: 310,
      image:
        "https://img.sixt.com/2800/515a4846-a4c1-46f4-8e6c-8031151e5e89.jpg",
    },
    {
      id: 14,
      brand: "Mercedes-Benz",
      model: "CLE",
      price: 280,
      image:
        "https://img.sixt.com/2800/2a352fec-1b42-482e-b97c-c31dfc951a86.png",
    },
    {
      id: 13,
      brand: "Audi",
      model: "A6 E-Tron",
      price: 260,
      image:
        "https://img.sixt.com/2800/bce9f85e-57ce-4959-9b62-19a7e0d7294b.png",
    },
  ];

  return (
    <section id="featured" className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#ff5f00]">
            Featured Fleet
          </p>
          <h3 className="text-3xl font-bold text-white">Popular cars for rent</h3>
        </div>

        <Link to="/cars" className="hidden text-sm font-semibold text-[#ff5f00] md:block">
          View all cars
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {featuredCars.map((car) => (
          <div
            key={car.id}
            className="overflow-hidden rounded-3xl border border-white/10 bg-[#111] shadow-xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-[#ff5f00]/40 hover:shadow-[0_20px_60px_rgba(255,95,0,0.18)]"
          >
            <img
              src={car.image}
              alt={`${car.brand} ${car.model}`}
              className="h-56 w-full object-cover transition duration-500 hover:scale-110"
            />

            <div className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-bold text-white">
                  {car.brand} {car.model}
                </h4>
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-gray-300">
                  Premium
                </span>
              </div>

              <div className="flex items-center gap-2 text-yellow-400">
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <span className="ml-2 text-sm text-gray-400">5.0</span>
              </div>

              <p className="text-sm leading-6 text-gray-400">
                Premium comfort, clean interior, reliable performance, and
                excellent daily rental value.
              </p>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Starting from</p>
                  <p className="text-2xl font-extrabold text-[#ff5f00]">
                    €{car.price}
                    <span className="ml-1 text-sm font-medium text-gray-400">/day</span>
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/cars/${car.id}`}
                    className="rounded-xl border border-white/10 px-4 py-2 font-semibold text-white transition hover:border-[#ff5f00]/50 hover:bg-white/5"
                  >
                    Details
                  </Link>

                  <Link
                    to={`/cars/${car.id}`}
                    className="rounded-xl bg-[#ff5f00] px-4 py-2 font-semibold text-white transition hover:scale-105 hover:bg-[#e55500]"
                  >
                    Book
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}