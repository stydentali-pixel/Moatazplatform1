"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Category = {
  id: string;
  name: string;
  slug: string;
  count: number;
};

export default function NavCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/public/categories");
        const json = await res.json();
        if (json.success) {
          setCategories(json.data.slice(0, 5)); // عرض أول 5 تصنيفات فقط في القائمة العلوية
        }
      } catch (err) {
        console.error("Failed to fetch nav categories", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex gap-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-4 w-16 bg-ink-900/10 rounded" />
        ))}
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <div className="flex items-center gap-6">
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/categories/${c.slug}`}
          className="text-ink-700 transition-colors hover:text-gold-700 whitespace-nowrap"
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}
