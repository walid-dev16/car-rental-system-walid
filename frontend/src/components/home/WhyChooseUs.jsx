import { BadgeDollarSign, ShieldCheck, CarFront } from "lucide-react";

export default function WhyChooseUs() {
  return (
    <section id="why-us" className="bg-[#0b0b0b] py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#ff5f00]">
            Why Choose Us
          </p>
          <h3 className="text-3xl font-bold text-white">
            Reliable service with premium experience
          </h3>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-black p-6">
            <div className="mb-4 inline-flex rounded-2xl bg-[#ff5f00]/10 p-3 text-[#ff5f00]">
              <BadgeDollarSign size={24} />
            </div>
            <h4 className="mb-3 text-xl font-bold text-white">Best price options</h4>
            <p className="text-gray-400">
              Transparent pricing, clear booking process, and no unnecessary hidden surprises.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black p-6">
            <div className="mb-4 inline-flex rounded-2xl bg-[#ff5f00]/10 p-3 text-[#ff5f00]">
              <ShieldCheck size={24} />
            </div>
            <h4 className="mb-3 text-xl font-bold text-white">Trusted rental service</h4>
            <p className="text-gray-400">
              Well-maintained fleet, secure process, and strong service quality for every customer.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black p-6">
            <div className="mb-4 inline-flex rounded-2xl bg-[#ff5f00]/10 p-3 text-[#ff5f00]">
              <CarFront size={24} />
            </div>
            <h4 className="mb-3 text-xl font-bold text-white">Premium vehicle fleet</h4>
            <p className="text-gray-400">
              Economy, sedan, luxury, and SUV options for different needs and different budgets.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}