"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Idea = {
  id: string; title: string; description?: string | null; notes?: string | null;
  status: "SUGGESTED" | "DRAFTED" | "APPROVED" | "REJECTED" | "SCHEDULED" | "PUBLISHED";
  source?: string | null; createdAt: string;
};

const STATUS_AR: Record<string, string> = {
  SUGGESTED: "مقترحة", DRAFTED: "مسوّدة", APPROVED: "معتمدة",
  REJECTED: "مرفوضة", SCHEDULED: "مجدولة", PUBLISHED: "منشورة",
};

export default function IdeasAdmin() {
  const router = useRouter();
  const [items, setItems] = useState<Idea[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  async function load() {
    const r = await fetch("/api/admin/ideas", { credentials: "include" });
    const j = await r.json();
    setItems(j?.data || []);
  }
  useEffect(() => { load(); }, []);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return;
    await fetch("/api/admin/ideas", {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    setTitle(""); setDescription("");
    load();
  }

  async function setStatus(id: string, status: Idea["status"]) {
    await fetch(`/api/admin/ideas/${id}`, {
      method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function convertToDraft(id: string) {
    const r = await fetch(`/api/admin/ideas/${id}/convert`, {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DRAFT" }),
    });
    const j = await r.json();
    if (j?.success) router.push(`/admin/posts/${j.data.id}`);
  }

  async function publishIdea(id: string) {
    if (!confirm("نشر هذا المقال مباشرة؟ لن يكون هناك تراجع.")) return;
    const r = await fetch(`/api/admin/ideas/${id}/convert`, {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PUBLISHED" }),
    });
    const j = await r.json();
    if (j?.success) router.push(`/admin/posts/${j.data.id}`);
    else alert(j?.error || "فشل النشر");
  }

  async function onDelete(id: string) {
    if (!confirm("حذف الفكرة؟")) return;
    await fetch(`/api/admin/ideas/${id}`, { method: "DELETE", credentials: "include" });
    load();
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <div className="text-gold-700 text-sm tracking-widest mb-2">المختبر</div>
        <h1 className="font-cairo text-3xl font-extrabold text-ink-900">أفكار المقالات</h1>
        <p className="text-ink-600 mt-2 text-sm">سجّل أفكاراً قبل أن تَنسى. حوّلها لاحقاً إلى مسوّدات أو منشورات.</p>
      </div>

      <div className="grid md:grid-cols-[1fr,380px] gap-6">
        <div className="space-y-3">
          {items.map((i) => (
            <div key={i.id} className="card p-5" data-testid={`idea-${i.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="font-cairo font-bold text-ink-900 text-lg">{i.title}</div>
                  {i.description ? <p className="text-ink-600 text-sm leading-7 mt-2">{i.description}</p> : null}
                  <div className="flex items-center gap-3 mt-3 text-xs text-ink-500">
                    <span className={`px-2 py-1 rounded-full ${
                      i.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" :
                      i.status === "REJECTED" ? "bg-red-100 text-red-700" :
                      i.status === "DRAFTED" ? "bg-amber-100 text-amber-800" :
                      i.status === "PUBLISHED" ? "bg-blue-100 text-blue-800" :
                      "bg-cream-200 text-ink-700"
                    }`}>{STATUS_AR[i.status]}</span>
                    <span>{new Date(i.createdAt).toLocaleDateString("ar-EG")}</span>
                    {i.source ? <span className="opacity-50">· {i.source}</span> : null}
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-xs">
                  {i.status === "SUGGESTED" || i.status === "APPROVED" ? (
                    <button onClick={() => convertToDraft(i.id)} className="px-3 py-1.5 rounded-full bg-gold-700 text-cream-50 hover:bg-gold-800" data-testid={`idea-draft-${i.id}`}>إلى مسوّدة</button>
                  ) : null}
                  {i.status === "SUGGESTED" ? (
                    <>
                      <button onClick={() => setStatus(i.id, "APPROVED")} className="px-3 py-1.5 rounded-full bg-emerald-700 text-cream-50 hover:bg-emerald-800" data-testid={`idea-approve-${i.id}`}>اعتماد</button>
                      <button onClick={() => setStatus(i.id, "REJECTED")} className="px-3 py-1.5 rounded-full bg-red-100 text-red-700 hover:bg-red-200" data-testid={`idea-reject-${i.id}`}>رفض</button>
                    </>
                  ) : null}
                  {i.status === "APPROVED" ? (
                    <button onClick={() => publishIdea(i.id)} className="px-3 py-1.5 rounded-full bg-ink-900 text-cream-50 hover:bg-ink-800" data-testid={`idea-publish-${i.id}`}>نشر مباشر</button>
                  ) : null}
                  <button onClick={() => onDelete(i.id)} className="px-3 py-1.5 rounded-full bg-cream-100 text-red-700 hover:bg-red-50" data-testid={`idea-delete-${i.id}`}>حذف</button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 ? <div className="card p-10 text-center text-ink-500">لا توجد أفكار بعد. أضف أوّل واحدة من اليسار.</div> : null}
        </div>

        <form onSubmit={onAdd} className="card p-6 h-fit" data-testid="idea-form">
          <h3 className="font-cairo font-bold text-ink-900 mb-4">+ فكرة جديدة</h3>
          <label className="block mb-3">
            <span className="block text-xs text-ink-500 mb-1">العنوان</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full bg-cream-50 border border-ink-900/10 rounded-xl px-4 py-2 text-sm" data-testid="idea-title-input"/>
          </label>
          <label className="block mb-4">
            <span className="block text-xs text-ink-500 mb-1">وصف مختصر</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full bg-cream-50 border border-ink-900/10 rounded-xl px-4 py-2 text-sm" data-testid="idea-desc-input"/>
          </label>
          <button className="btn-gold w-full text-sm py-2" data-testid="idea-add-btn">إضافة الفكرة</button>
          <p className="text-[11px] text-ink-500 mt-3 leading-5">
            💡 ENABLE_AI_CONTENT حالياً معطّل. عند تفعيله لاحقاً، سيتم توليد المسوّدات تلقائياً من العناوين.
          </p>
        </form>
      </div>
    </div>
  );
}
