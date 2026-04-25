"use client";
import { useEffect, useState } from "react";

type P = { id: string; title: string; slug: string; content: string; published: boolean; updatedAt: string };

export default function PagesAdmin() {
  const [items, setItems] = useState<P[]>([]);
  const [editing, setEditing] = useState<P | null>(null);
  const [form, setForm] = useState({ title: "", slug: "", content: "", published: true });

  async function load() {
    const r = await fetch("/api/admin/pages", { credentials: "include" });
    const j = await r.json();
    setItems(j?.data || []);
  }
  useEffect(() => { load(); }, []);

  function startNew() {
    setEditing(null);
    setForm({ title: "", slug: "", content: "", published: true });
  }

  function startEdit(p: P) {
    setEditing(p);
    setForm({ title: p.title, slug: p.slug, content: p.content, published: p.published });
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      await fetch(`/api/admin/pages/${editing.id}`, {
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/admin/pages", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    startNew();
    load();
  }

  async function onDelete(id: string) {
    if (!confirm("حذف هذه الصفحة؟")) return;
    await fetch(`/api/admin/pages/${id}`, { method: "DELETE", credentials: "include" });
    if (editing?.id === id) startNew();
    load();
  }

  return (
    <div className="max-w-7xl">
      <div className="mb-8">
        <div className="text-gold-700 text-sm tracking-widest mb-2">المحتوى</div>
        <h1 className="font-cairo text-3xl font-extrabold text-ink-900">الصفحات</h1>
        <p className="text-ink-600 mt-2 text-sm">صفحات ثابتة مثل "من نحن" و"اتصل بنا" و"الخصوصيّة".</p>
      </div>

      <div className="grid md:grid-cols-[300px,1fr] gap-6">
        <div className="space-y-2">
          <button onClick={startNew} className="w-full btn-gold text-sm py-2" data-testid="pages-new-btn">+ صفحة جديدة</button>
          {items.map((p) => (
            <button key={p.id} onClick={() => startEdit(p)} className={`w-full text-right p-3 rounded-xl transition-colors ${editing?.id === p.id ? "bg-gold-700 text-cream-50" : "bg-cream-50 hover:bg-cream-100"}`} data-testid={`page-${p.slug}`}>
              <div className="font-cairo font-bold text-sm">{p.title}</div>
              <div className={`text-xs ${editing?.id === p.id ? "text-cream-100/70" : "text-ink-500"} font-mono mt-0.5`}>/{p.slug}</div>
            </button>
          ))}
        </div>

        <form onSubmit={onSave} className="card p-6 space-y-4" data-testid="pages-form">
          <h3 className="font-cairo font-bold text-ink-900 mb-2">{editing ? `تعديل: ${editing.title}` : "صفحة جديدة"}</h3>
          <label className="block">
            <span className="block text-xs text-ink-500 mb-1">العنوان</span>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="w-full bg-cream-50 border border-ink-900/10 rounded-xl px-4 py-2 text-sm" data-testid="page-title-input"/>
          </label>
          <label className="block">
            <span className="block text-xs text-ink-500 mb-1">الرابط (slug)</span>
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="about" className="w-full bg-cream-50 border border-ink-900/10 rounded-xl px-4 py-2 text-sm font-mono text-xs" data-testid="page-slug-input"/>
          </label>
          <label className="block">
            <span className="block text-xs text-ink-500 mb-1">المحتوى (HTML)</span>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={14} className="w-full bg-cream-50 border border-ink-900/10 rounded-xl px-4 py-2 text-sm font-mono" data-testid="page-content-input"/>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })}/>
            منشورة
          </label>
          <div className="flex gap-2 pt-2">
            <button className="btn-gold text-sm py-2 px-4" data-testid="page-save-btn">{editing ? "تحديث" : "إضافة"}</button>
            {editing ? <button type="button" onClick={() => onDelete(editing.id)} className="btn-ghost text-sm py-2 px-4 text-red-700 border-red-200">حذف</button> : null}
          </div>
        </form>
      </div>
    </div>
  );
}
