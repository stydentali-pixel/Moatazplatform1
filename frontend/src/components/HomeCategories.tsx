"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Category = {
  id: string;
  name: string;
  slug: string;
  count: number;
};

export default function HomeCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/public/categories");
        const json = await res.json();
        if (json.success) {
          setCategories(json.data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Failed to fetch home categories", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="container-px mx-auto max-w-7xl py-14 sm:py-20">
        <div className="h-8 w-48 bg-ink-900/10 rounded mb-10 animate-pulse" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-ink-900/5 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (error) return null;

  if (categories.length === 0) {
    return (
      <section className="container-px mx-auto max-w-7xl py-14 sm:py-20 text-center">
        <h2 className="heading-sec mb-6 text-center">التصنيفات</h2>
        <div className="rounded-2xl border border-dashed border-ink-900/20 py-12 text-ink-500">
          لا توجد تصنيفات متاحة حالياً.
        </div>
      </section>
    );
  }

  return (
    <section className="container-px mx-auto max-w-7xl py-14 sm:py-20">
      <div className="mb-10 flex items-end justify-between gap-4">
        <h2 className="heading-sec">استكشف حسب التصنيف</h2>
        <Link href="/categories" className="text-sm text-ink-600 hover:text-gold-700">جميع التصنيفات ←</Link>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {categories.map((c, idx) => (
          <Link 
            key={c.id} 
            href={`/categories/${c.slug}`} 
            className="group relative rounded-2xl border border-ink-900/5 bg-cream-50 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-gold-500 hover:shadow-lg sm:p-6" 
            data-testid={`category-card-${c.slug}`}
          >
            <div className="mb-2 font-amiri text-3xl text-gold-700">{String(idx + 1).padStart(2, "0")}</div>
            <div className="font-cairo font-bold text-ink-900 transition-colors group-hover:text-gold-700">{c.name}</div>
            <div className="mt-1 text-xs text-ink-500">{c.count} منشور</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
