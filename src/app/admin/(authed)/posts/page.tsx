"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Post = {
  id: string; title: string; slug: string; status: string; type: string;
  publishedAt?: string | null; updatedAt: string; featured: boolean;
  category?: { name: string } | null;
};

const STATUS_AR: Record<string, string> = {
  DRAFT: "مسودة", PUBLISHED: "منشور", SCHEDULED: "مجدول", ARCHIVED: "مؤرشف",
};
const TYPE_AR: Record<string, string> = {
  ARTICLE: "مقال", STORY: "قصة", LINK: "رابط", IMAGE: "صورة", VIDEO: "فيديو", QUOTE: "اقتباس",
};

export default function AdminPostsPage() {
  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (q) params.set("q", q);
    const r = await fetch(`/api/admin/posts?${params.toString()}`, { credentials: "include" });
    const j = await r.json();
    setItems(j?.data?.items || []);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [statusFilter]);

  async function onDelete(id: string) {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    const r = await fetch(`/api/admin/posts/${id}`, { method: "DELETE", credentials: "include" });
    if (r.ok) load();
  }

  async function onArchive(id: string) {
    await fetch(`/api/admin/posts/${id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ARCHIVED" }),
    });
    load();
  }

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-gold-700 text-sm tracking-widest mb-2">المحتوى</div>
          <h1 className="font-cairo text-3xl font-extrabold text-ink-900">المقالات</h1>
        </div>
        <Link href="/admin/posts/new" className="btn-gold" data-testid="admin-new-post-btn">+ مقال جديد</Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-cream-50 border border-ink-900/10 rounded-full px-4 py-2 text-sm" data-testid="admin-posts-status-filter">
          <option value="">كل الحالات</option>
          <option value="DRAFT">مسودة</option>
          <option value="PUBLISHED">منشور</option>
          <option value="SCHEDULED">مجدول</option>
          <option value="ARCHIVED">مؤرشف</option>
        </select>
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن عنوان..." className="bg-cream-50 border border-ink-900/10 rounded-full px-4 py-2 text-sm" data-testid="admin-posts-search-input"/>
          <button className="btn-ghost text-sm py-2 px-4" data-testid="admin-posts-search-btn">بحث</button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream-100 text-ink-700">
            <tr>
              <th className="text-right p-4 font-cairo">العنوان</th>
              <th className="text-right p-4 font-cairo">النوع</th>
              <th className="text-right p-4 font-cairo">التصنيف</th>
              <th className="text-right p-4 font-cairo">الحالة</th>
              <th className="text-right p-4 font-cairo">آخر تحديث</th>
              <th className="text-right p-4 font-cairo">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-ink-500">...جاري التحميل</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-ink-500">لا توجد منشورات</td></tr>
            ) : items.map((p) => (
              <tr key={p.id} className="border-t border-ink-900/5 hover:bg-cream-50" data-testid={`admin-post-row-${p.id}`}>
                <td className="p-4">
                  <Link href={`/admin/posts/${p.id}`} className="font-cairo font-bold text-ink-900 hover:text-gold-700">{p.title}</Link>
                  {p.featured ? <span className="ms-2 text-[10px] bg-gold-100 text-gold-800 px-2 py-0.5 rounded-full">مميّز</span> : null}
                </td>
                <td className="p-4 text-ink-600">{TYPE_AR[p.type] || p.type}</td>
                <td className="p-4 text-ink-600">{p.category?.name || "—"}</td>
                <td className="p-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    p.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-800" :
                    p.status === "DRAFT" ? "bg-amber-100 text-amber-800" :
                    p.status === "SCHEDULED" ? "bg-blue-100 text-blue-800" : "bg-ink-100 text-ink-700"
                  }`}>{STATUS_AR[p.status] || p.status}</span>
                </td>
                <td className="p-4 text-ink-500 text-xs">{new Date(p.updatedAt).toLocaleDateString("ar-EG")}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/posts/${p.id}`} className="text-gold-700 hover:underline text-xs" data-testid={`edit-post-${p.id}`}>تعديل</Link>
                    {p.status !== "ARCHIVED" ? (
                      <button onClick={() => onArchive(p.id)} className="text-ink-600 hover:underline text-xs" data-testid={`archive-post-${p.id}`}>أرشفة</button>
                    ) : null}
                    <button onClick={() => onDelete(p.id)} className="text-red-600 hover:underline text-xs" data-testid={`delete-post-${p.id}`}>حذف</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
