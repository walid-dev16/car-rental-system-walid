import React, { useState } from "react";
import API from "../api/api.js";
import {
  MapPin,
  Clock3,
  MessageSquareMore,
} from "lucide-react";
import Navbar from "../components/home/Navbar.jsx";
import Footer from "../components/home/Footer.jsx";

export default function ContactPage() {
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function sendMessage(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setSending(true);
    setNotice("");
    setError("");
    try {
      const { data } = await API.post("/contact", Object.fromEntries(new FormData(form)));
      setNotice(data.message);
      form.reset();
    } catch (err) {
      setError(err.response?.data?.message || "We could not save your message. Please try again.");
    } finally {
      setSending(false);
    }
  }
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="border-b border-white/10 bg-gradient-to-r from-[#0f0f0f] to-[#171717]">
        <div className="mx-auto max-w-[1500px] px-6 py-16">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#ff5f00]">
            Contact Us
          </p>
          <h1 className="text-4xl font-black text-white md:text-5xl">
            We’re here to help
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-gray-300">
            Have a question about bookings, cars, pricing, or support? Contact
            the AutoLuxe team and we’ll get back to you as soon as possible.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-[#111] p-8 shadow-xl">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white">Send us a message</h2>
              <p className="mt-3 text-gray-400">
                Fill in the form below and our team will contact you shortly.
              </p>
            </div>

            <form className="grid gap-5" onSubmit={sendMessage}>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className="mb-2 block text-sm text-gray-400">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="contact-name" name="sender_name" autoComplete="name" maxLength={100} required
                    placeholder="Your full name"
                    className="w-full rounded-2xl border border-white/10 bg-[#1b1b1b] px-4 py-3 text-white outline-none placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <label htmlFor="contact-email" className="mb-2 block text-sm text-gray-400">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="contact-email" name="email" autoComplete="email" maxLength={254} required
                    placeholder="you@example.com"
                    className="w-full rounded-2xl border border-white/10 bg-[#1b1b1b] px-4 py-3 text-white outline-none placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-subject" className="mb-2 block text-sm text-gray-400">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="How can we help?"
                  id="contact-subject" name="subject" maxLength={150} required
                  className="w-full rounded-2xl border border-white/10 bg-[#1b1b1b] px-4 py-3 text-white outline-none placeholder:text-gray-500"
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="mb-2 block text-sm text-gray-400">
                  Message
                </label>
                <textarea
                  rows="6"
                  id="contact-message" name="message" maxLength={4000} required
                  placeholder="Write your message here..."
                  className="w-full rounded-2xl border border-white/10 bg-[#1b1b1b] px-4 py-3 text-white outline-none placeholder:text-gray-500"
                />
              </div>

              <button
                type="submit" disabled={sending}
                className="inline-flex w-fit items-center gap-2 rounded-2xl bg-[#ff5f00] px-6 py-3 font-bold text-white transition hover:scale-[1.02] hover:bg-[#e55500]"
              >
                <MessageSquareMore size={18} />
                {sending ? "Sending…" : "Send Message"}
              </button>
              {notice && <p role="status" className="text-green-300">{notice}</p>}
              {error && <p role="alert" className="text-red-300">{error}</p>}
            </form>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-[#111] p-6 shadow-xl">
              <h3 className="mb-5 text-2xl font-bold text-white">
                Contact Information
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-4 rounded-2xl bg-black/30 p-4">
                  <div className="rounded-2xl bg-[#ff5f00]/10 p-3 text-[#ff8a3d]">
                    <MessageSquareMore size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Rental office</p>
                    <a href="#contact-name" className="mt-1 inline-block text-sm text-[#ff8a3d] underline">
                      Open the message form
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl bg-black/30 p-4">
                  <div className="rounded-2xl bg-[#ff5f00]/10 p-3 text-[#ff8a3d]">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Office</p>
                    <p className="mt-1 text-sm text-gray-400">
                      Erfurt, Germany
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#111] p-6 shadow-xl">
              <h3 className="mb-5 text-2xl font-bold text-white">Working Hours</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl bg-black/30 p-4">
                  <div className="flex items-center gap-3">
                    <Clock3 size={18} className="text-[#ff8a3d]" />
                    <span className="text-white">Monday - Friday</span>
                  </div>
                  <span className="text-gray-400">08:00 - 18:00</span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-black/30 p-4">
                  <div className="flex items-center gap-3">
                    <Clock3 size={18} className="text-[#ff8a3d]" />
                    <span className="text-white">Saturday</span>
                  </div>
                  <span className="text-gray-400">10:00 - 16:00</span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-black/30 p-4">
                  <div className="flex items-center gap-3">
                    <Clock3 size={18} className="text-[#ff8a3d]" />
                    <span className="text-white">Sunday</span>
                  </div>
                  <span className="text-gray-400">Closed</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#ff5f00]/10 to-[#111] p-6 shadow-xl">
              <h3 className="text-2xl font-bold text-white">Need quick support?</h3>
              <p className="mt-3 text-gray-300">
                For urgent booking issues, contact our support team during
                working hours and we’ll help you as quickly as possible.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
