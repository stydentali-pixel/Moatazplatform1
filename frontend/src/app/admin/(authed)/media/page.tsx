"use client";
import { useEffect, useRef, useState } from "react";

type M = { id: string; url: string; filename: string; mimeType: string; size: number; altText?: string | null; createdAt: string; storage?: string };

export default function MediaAdmin() {
  const [items, setItems] = useState<M[]>([]);
  const [uploading, setUploading] = useState(false);
  const [storageMode, setStorageMode] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const r = await fetch("/api/admin/media", { credentials: "include" });
    const j = await r.json();
    setItems(j?.data || []);
  }
  useEffect(() => { load(); }, []);

  async function onUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/admin/media", { method: "POST", body: fd, credentials: "include" });
    const j = await r.json();
    if (j?.success && j.data?.storage) setStorageMode(j.data.storage);
    setUploading(false);
    load();
  }

  async function onDelete(id: string) {
    if (!confirm("حذف هذا الملف؟")) return;
    await fetch(`/api/admin/media/${id}`, { method: "DELETE", credentials: "include" });
    load();
  }

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-gold-700 text-sm tracking-widest mb-2">المكتبة</div>
          <h1 className="font-cairo text-3xl font-extrabold text-ink-900">الوسائط</h1>
          {storageMode === "inline" ? (
            <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full inline-block px-3 py-1">
              ⚠ يُستخدم تخزين مؤقّت داخل قاعدة البيانات. أضف SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY لتفعيل التخزين السحابي.
            </div>
          ) : null}
        </div>
        <label className="btn-gold cursor-pointer" data-testid="media-upload-label">
          {uploading ? "جاري الرفع..." : "رفع ملف"}
          <input ref={fileRef} type="file" className="hidden" accept="image/*,video/*" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} data-testid="media-upload-input"/>
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((m) => (
          <div key={m.id} className="card overflow-hidden group relative" data-testid={`media-${m.id}`}>
            <div className="aspect-square bg-cream-100">
              {m.mimeType.startsWith("image/") ? (
                <img src={m.url} alt={m.altText || m.filename} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ink-500">{m.mimeType}</div>
              )}
            </div>
            <div className="p-3 text-xs">
              <div className="truncate font-medium text-ink-700">{m.filename}</div>
              <div className="text-ink-400 mt-1">{(m.size / 1024).toFixed(1)} KB</div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => navigator.clipboard.writeText(m.url)} className="text-gold-700 hover:underline" data-testid={`media-copy-${m.id}`}>نسخ الرابط</button>
                <button onClick={() => onDelete(m.id)} className="text-red-600 hover:underline" data-testid={`media-del-${m.id}`}>حذف</button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 ? <div className="col-span-full text-center text-ink-500 py-20">لا توجد ملفات بعد. ارفع أوّل ملف!</div> : null}
      </div>
    </div>
  );
}
