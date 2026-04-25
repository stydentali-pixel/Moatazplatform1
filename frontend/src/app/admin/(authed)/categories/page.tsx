"use client";
import { useEffect, useState } from "react";

type Cat = { id: string; name: string; slug: string; description?: string | null; count?: number };

export default function CategoriesAdmin() {
  const [items, setItems] = useState<Cat[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<Cat | null>(null);

  async function load() {
    const r = await fetch("/api/admin/categories", { credentials: "include" });
    const j = await r.json();
    setItems(j?.data || []);
  }
  useEffect(() => { load(); }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    if (editing) {
      await fetch(`/api/admin/categories/${editing.id}`, {
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      setEditing(null);
    } else {
      await fetch("/api/admin/categories", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
    }
    setName(""); setDescription("");
    load();
  }

  async function onDelete(id: string) {
    if (!confirm("حذف هذا التصنيف؟")) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE", credentials: "include" });
    load();
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <div className="text-gold-700 text-sm tracking-widest mb-2">التنظيم</div>
        <h1 className="font-cairo text-3xl font-extrabold text-ink-900">التصنيفات</h1>
      </div>

      <div className="grid md:grid-cols-[1fr,360px] gap-6">
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-ink-700">
              <tr>
                <th className="text-right p-4 font-cairo">الاسم</th>
                <th className="text-right p-4 font-cairo">الرابط</th>
                <th className="text-right p-4 font-cairo">المنشورات</th>
                <th className="text-right p-4 font-cairo">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-t border-ink-900/5" data-testid={`category-row-${c.slug}`}>
                  <td className="p-4 font-cairo font-bold text-ink-900">{c.name}</td>
                  <td className="p-4 text-ink-500 text-xs font-mono">{c.slug}</td>
                  <td className="p-4 text-ink-600">{c.count || 0}</td>
                  <td className="p-4">
                    <button onClick={() => { setEditing(c); setName(c.name); setDescription(c.description || ""); }} className="text-gold-700 hover:underline text-xs me-3" data-testid={`edit-cat-${c.slug}`}>تعديل</button>
                    <button onClick={() => onDelete(c.id)} className="text-red-600 hover:underline text-xs" data-testid={`del-cat-${c.slug}`}>حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form onSubmit={onSave} className="card p-6 h-fit" data-testid="category-form">
          <h3 className="font-cairo font-bold text-ink-900 mb-4">{editing ? "تعديل تصنيف" : "تصنيف جديد"}</h3>
          <label className="block mb-3">
            <span className="block text-xs text-ink-500 mb-1">الاسم</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-cream-50 border border-ink-900/10 rounded-xl px-4 py-2 text-sm" data-testid="cat-name-input"/>
          </label>
          <label className="block mb-4">
            <span className="block text-xs text-ink-500 mb-1">وصف</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-cream-50 border border-ink-900/10 rounded-xl px-4 py-2 text-sm" data-testid="cat-desc-input"/>
          </label>
          <div className="flex gap-2">
            <button type="submit" className="btn-gold text-sm py-2 px-4" data-testid="cat-save-btn">{editing ? "تحديث" : "إضافة"}</button>
            {editing ? <button type="button" onClick={() => { setEditing(null); setName(""); setDescription(""); }} className="btn-ghost text-sm py-2 px-4">إلغاء</button> : null}
          </div>
        </form>
      </div>
    </div>
  );
}
