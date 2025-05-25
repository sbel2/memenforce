"use client";

import { useState } from "react";

export default function Home() {
  const [status, setStatus] = useState("");

  const sendReminder = async () => {
    setStatus("Sending...");
    try {
      const res = await fetch("/api/send", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setStatus("✅ Reminder sent!");
      } else {
        setStatus("❌ Error: " + (data?.message || "Unknown error"));
      }
    } catch (err) {
      setStatus("❌ Network error.");
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 bg-white dark:bg-black text-black dark:text-white p-6">
      <h1 className="text-4xl font-bold">Welcome to Memforce</h1>
      <button
        onClick={sendReminder}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
      >
        Send Birthday Reminder
      </button>
      {status && <p className="text-sm mt-2">{status}</p>}
    </main>
  );
}
