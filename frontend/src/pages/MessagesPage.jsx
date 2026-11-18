import { useEffect, useState } from "react";
import DashboardHeader from "../components/DashboardHeader.jsx";
import API from "../api/api.js";

export default function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [next, setNext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  function loadPage(before) {
    setLoading(true);
    setError("");
    setCursor(before);
    setAttempt((value) => value + 1);
  }

  useEffect(() => {
    const controller = new AbortController();
    API.get("/contact", { params: cursor ? { before: cursor } : {}, signal: controller.signal })
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        setMessages((previous) => cursor ? [...previous, ...data.messages] : data.messages);
        setNext(data.next);
      })
      .catch(() => { if (!controller.signal.aborted) setError("Unable to load messages."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [cursor, attempt]);

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <DashboardHeader title="Contact messages" />
        {messages.map((item) => (
          <article key={item.id} className="mb-4 rounded-2xl border border-white/10 bg-[#151515] p-5">
            <h2 className="break-words text-xl font-bold">{item.subject}</h2>
            <p className="mt-1 break-words text-sm text-gray-400">{item.sender_name} · {item.email}</p>
            <time className="text-sm text-gray-400" dateTime={item.created_at}>
              {new Date(item.created_at).toLocaleString("en-GB", { timeZone: "Europe/Berlin", timeZoneName: "short" })}
            </time>
            <p className="mt-4 whitespace-pre-wrap break-words">{item.message}</p>
          </article>
        ))}
        {loading && <p role="status">Loading messages…</p>}
        {!loading && !error && messages.length === 0 && <p>No contact messages yet.</p>}
        {error && <p role="alert">{error} <button className="underline" onClick={() => loadPage(cursor)}>Retry</button></p>}
        {!loading && !error && next && <button className="underline" onClick={() => loadPage(next)}>Load older messages</button>}
      </div>
    </main>
  );
}
