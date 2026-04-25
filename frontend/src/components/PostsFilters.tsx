"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const TYPES = [
  { v: "", label: "الكلّ" },
  { v: "ARTICLE", label: "مقالات" },
  { v: "STORY", label: "قصص" },
  { v: "LINK", label: "روابط" },
  { v: "IMAGE", label: "صور" },
  { v: "VIDEO", label: "فيديوهات" },
  { v: "QUOTE", label: "اقتباسات" },
];

export default function PostsFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [type, setType] = useState(sp.get("type") || "");
  const [sort, setSort] = useState(sp.get("sort") || "latest");

  useEffect(() => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (sort && sort !== "latest") params.set("sort", sort);
    router.push(`/posts${params.toString() ? `?${params.toString()}` : ""}`);
  }, [type, sort, router]);

  return (
    <div className="flex flex-wrap items-center gap-3 mb-8" data-testid="posts-filters">
      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t.v}
            onClick={() => setType(t.v)}
            className={`chip ${type === t.v ? "chip-active" : ""}`}
            data-testid={`filter-type-${t.v || "all"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="ms-auto">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="bg-cream-50 border border-ink-900/10 rounded-full px-4 py-2 text-sm text-ink-700 focus:outline-none focus:border-gold-500"
          data-testid="filter-sort"
        >
          <option value="latest">الأحدث</option>
          <option value="popular">الأكثر قراءة</option>
        </select>
      </div>
    </div>
  );
}
