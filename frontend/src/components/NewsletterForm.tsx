"use client";
import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const r = await fetch("/api/public/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const j = await r.json();
      setStatus(j?.data?.subscribed ? "ok" : "err");
      if (j?.data?.subscribed) setEmail("");
    } catch {
      setStatus("err");
    }
  }

  return (
    <form className="flex gap-2" onSubmit={onSubmit} data-testid="newsletter-form">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="بريدك الإلكتروني"
        className="flex-1 bg-ink-800 border border-cream-100/10 rounded-full px-4 py-2 text-sm text-cream-100 placeholder:text-cream-100/40 focus:outline-none focus:border-gold-500"
        data-testid="newsletter-email-input"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="bg-gold-600 hover:bg-gold-500 disabled:opacity-60 transition-colors text-cream-50 px-4 py-2 rounded-full text-sm whitespace-nowrap"
        data-testid="newsletter-submit-btn"
      >
        {status === "ok" ? "✓ اشتركت" : status === "loading" ? "..." : "اشترك"}
      </button>
    </form>
  );
}
