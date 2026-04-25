"use client";
import { useEffect, useState } from "react";

type T = { id: string; name: string; slug: string; count?: number };

export default function TagsAdmin() {
  const [items, setItems] = useState<T[]>([]);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<T | null>(null);

  async function load() {
    const r = await fetch("/api/admin/tags", { credentials: "include" });
    const j = await r.json();
    setItems(j?.data || []);
  }
  useEffect(() => { load(); }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    if (editing) {
      await fetch(`/api/admin/tags/${editing.id}`, {
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setEditing(null);
    } else {
      await fetch("/api/admin/tags", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
    }
    setName("");
    load();
  }

  async function onDelete(id: string) {
    if (!confirm("حذف الوسم؟")) return;
    await fetch(`/api/admin/tags/${id}`, { method: "DELETE", credentials: "include" });
    load();
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <div className="text-gold-700 text-sm tracking-widest mb-2">التنظيم</div>
        <h1 className="font-cairo text-3xl font-extrabold text-ink-900">الوسوم</h1>
      </div>

      <form onSubmit={onSave} className="card p-4 mb-6 flex gap-2" data-testid="tag-form">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم الوسم" className="flex-1 bg-cream-50 border border-ink-900/10 rounded-full px-4 py-2 text-sm" data-testid="tag-name-input"/>
        <button className="btn-gold text-sm py-2 px-4" data-testid="tag-save-btn">{editing ? "تحديث" : "إضافة"}</button>
        {editing ? <button type="button" onClick={() => { setEditing(null); setName(""); }} className="btn-ghost text-sm py-2 px-4">إلغاء</button> : null}
      </form>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream-100 text-ink-700">
            <tr>
              <th className="text-right p-4 font-cairo">الاسم</th>
              <th className="text-right p-4 font-cairo">الرابط</th>
              <th className="text-right p-4 font-cairo">عدد المنشورات</th>
              <th className="text-right p-4 font-cairo">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} className="border-t border-ink-900/5" data-testid={`tag-row-${t.slug}`}>
                <td className="p-4 font-cairo font-bold">#{t.name}</td>
                <td className="p-4 text-ink-500 text-xs font-mono">{t.slug}</td>
                <td className="p-4 text-ink-600">{t.count || 0}</td>
                <td className="p-4">
                  <button onClick={() => { setEditing(t); setName(t.name); }} className="text-gold-700 hover:underline text-xs me-3" data-testid={`edit-tag-${t.slug}`}>تعديل</button>
                  <button onClick={() => onDelete(t.id)} className="text-red-600 hover:underline text-xs" data-testid={`del-tag-${t.slug}`}>حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
