import React from "react";
import {
  ShieldCheck,
  BadgeEuro,
  CarFront,
  CalendarCheck2,
  Headphones,
  MapPinned,
  Clock3,
  Star,
} from "lucide-react";
import Navbar from "../components/home/Navbar.jsx";
import Footer from "../components/home/Footer.jsx";

const highlights = [
  {
    icon: <BadgeEuro size={22} />,
    title: "Transparent Pricing",
    text: "Clear daily rates with no confusing hidden charges. What you see is what you pay.",
  },
  {
    icon: <CarFront size={22} />,
    title: "Premium Vehicle Fleet",
    text: "From economy to luxury, AutoLuxe offers clean, modern, and carefully selected vehicles.",
  },
  {
    icon: <CalendarCheck2 size={22} />,
    title: "Easy Booking Process",
    text: "Simple browsing, fast booking, and smooth reservation management for every user.",
  },
  {
    icon: <ShieldCheck size={22} />,
    title: "Reliable & Secure",
    text: "We focus on safe booking logic, trusted service, and stable customer account handling.",
  },
  {
    icon: <Headphones size={22} />,
    title: "Helpful Support",
    text: "Our team is ready to assist with booking questions, changes, and urgent rental support.",
  },
  {
    icon: <MapPinned size={22} />,
    title: "Multiple City Coverage",
    text: "Cars can be booked for major German cities including Erfurt, Berlin, Frankfurt, Munich, and Hamburg.",
  },
];

const stats = [
  { value: "15+", label: "Cars in fleet" },
  { value: "5", label: "Supported cities" },
  { value: "24/7", label: "Online access" },
  { value: "100%", label: "Focused on simplicity" },
];

const steps = [
  {
    title: "Browse Cars",
    text: "Visitors and customers can view available cars, compare categories, and review detailed specs.",
  },
  {
    title: "Choose Your Dates",
    text: "Select pickup and return time, then continue with the booking flow that matches your trip.",
  },
  {
    title: "Confirm Reservation",
    text: "Once approved, the reservation is confirmed and the selected car status is updated accordingly.",
  },
  {
    title: "Manage with Ease",
    text: "Admins and staff can track bookings, manage customers, and handle operational changes quickly.",
  },
];

export default function WhyUsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="border-b border-white/10 bg-gradient-to-r from-[#0f0f0f] to-[#171717]">
        <div className="mx-auto max-w-[1500px] px-6 py-16">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#ff5f00]">
            Why Choose AutoLuxe
          </p>
          <h1 className="text-4xl font-black text-white md:text-5xl">
            Premium rental experience, built to feel easy
          </h1>
          <p className="mt-4 max-w-4xl text-lg leading-8 text-gray-300">
            AutoLuxe combines elegant design, premium vehicles, and a practical
            booking system to deliver a smooth rental experience for guests,
            customers, staff, and administrators.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-6 py-12">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-white/10 bg-[#111] p-6 shadow-xl transition hover:border-[#ff5f00]/30 hover:bg-[#151515]"
            >
              <div className="mb-4 inline-flex rounded-2xl bg-[#ff5f00]/10 p-3 text-[#ff8a3d]">
                {item.icon}
              </div>
              <h3 className="text-2xl font-bold text-white">{item.title}</h3>
              <p className="mt-3 leading-7 text-gray-400">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-6 py-4">
        <div className="grid gap-6 rounded-[32px] border border-white/10 bg-[#111] p-8 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="rounded-3xl bg-black/30 p-6 text-center">
              <p className="text-4xl font-black text-[#ff5f00]">{item.value}</p>
              <p className="mt-2 text-gray-400">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[32px] border border-white/10 bg-[#111] p-8 shadow-xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#ff5f00]">
              How it works
            </p>
            <h2 className="text-3xl font-black text-white">Simple process, better control</h2>

            <div className="mt-8 space-y-5">
              {steps.map((step, index) => (
                <div key={step.title} className="flex gap-4 rounded-3xl bg-black/30 p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#ff5f00] font-bold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{step.title}</h3>
                    <p className="mt-2 leading-7 text-gray-400">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-white/10 bg-[#111] p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-white">What makes us different?</h3>
              <p className="mt-4 leading-8 text-gray-400">
                AutoLuxe is designed not only for customers, but also for the people
                managing the platform. Admins can manage cars, users, and bookings,
                while staff can handle daily operations without unnecessary complexity.
              </p>
              <p className="mt-4 leading-8 text-gray-400">
                This means the whole system stays easier to manage, more transparent,
                and much more practical for real rental workflows.
              </p>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-[#111] p-8 shadow-xl">
              <div className="mb-4 flex items-center gap-3">
                <Star className="text-[#ff8a3d]" size={22} />
                <h3 className="text-2xl font-bold text-white">Service promise</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl bg-black/30 p-4">
                  <span className="text-white">Fast booking experience</span>
                  <span className="text-[#ff8a3d]">Included</span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-black/30 p-4">
                  <span className="text-white">Premium fleet presentation</span>
                  <span className="text-[#ff8a3d]">Included</span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-black/30 p-4">
                  <span className="text-white">Booking and user management</span>
                  <span className="text-[#ff8a3d]">Included</span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-black/30 p-4">
                  <span className="text-white">Clear operational overview</span>
                  <span className="text-[#ff8a3d]">Included</span>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#ff5f00]/10 to-[#111] p-8 shadow-xl">
              <div className="mb-4 flex items-center gap-3">
                <Clock3 className="text-[#ff8a3d]" size={22} />
                <h3 className="text-2xl font-bold text-white">Built for modern rentals</h3>
              </div>
              <p className="leading-8 text-gray-300">
                Whether someone is just browsing as a guest or managing the business
                as an administrator, the experience stays consistent, clear, and premium.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}