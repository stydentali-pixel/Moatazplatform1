"use client";
import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PostCard from "@/components/PostCard";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const r = await fetch(`/api/public/search?q=${encodeURIComponent(q)}`);
      const j = await r.json();
      setItems(j?.data?.items || []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <section className="container-px max-w-5xl mx-auto py-14">
        <div className="mb-10">
          <div className="text-gold-700 text-sm tracking-widest mb-2">بحث</div>
          <h1 className="heading-sec">عمّاذا تبحث؟</h1>
        </div>
        <form onSubmit={onSubmit} className="flex gap-2 mb-12" data-testid="search-form">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث عن مقال أو قصّة أو موضوع…"
            className="flex-1 bg-cream-50 border border-ink-900/10 rounded-full px-6 py-4 text-lg text-ink-900 placeholder:text-ink-500 focus:outline-none focus:border-gold-500 transition-colors"
            data-testid="search-input"
          />
          <button type="submit" className="btn-gold" data-testid="search-submit">{loading ? "..." : "ابحث"}</button>
        </form>
        {searched ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((p: any) => (
              <PostCard key={p.id} post={p} />
            ))}
            {items.length === 0 && !loading ? (
              <div className="col-span-full text-center text-ink-500 py-20" data-testid="search-empty">لا توجد نتائج لـ "{q}"</div>
            ) : null}
          </div>
        ) : null}
      </section>
      <SiteFooter />
    </>
  );
}
