"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PostCard from "@/components/PostCard";

function SearchInner() {
  const sp = useSearchParams();
  const initialQ = sp.get("q") || "";
  const [q, setQ] = useState(initialQ);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function runSearch(query: string) {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const r = await fetch(`/api/public/search?q=${encodeURIComponent(query)}`);
      const j = await r.json();
      setItems(j?.data?.items || []);
    } finally {
      setLoading(false);
    }
  }

  // auto-run when ?q= present on first mount
  useEffect(() => {
    if (initialQ) runSearch(initialQ);
    // eslint-disable-next-line
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch(q);
  }

  return (
    <>
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
    </>
  );
}

export default function SearchClient() {
  return (
    <Suspense fallback={<div className="text-ink-500">...</div>}>
      <SearchInner />
    </Suspense>
  );
}
