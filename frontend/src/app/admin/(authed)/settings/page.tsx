"use client";
import { useEffect, useState } from "react";

const FIELDS: Array<{ key: string; label: string; type?: string; placeholder?: string }> = [
  { key: "siteName", label: "اسم الموقع" },
  { key: "siteDescription", label: "وصف الموقع" },
  { key: "logo", label: "رابط الشعار", placeholder: "/brand/logo.jpg أو https://..." },
  { key: "authorAvatar", label: "صورة الكاتب/الأدمن", placeholder: "https://..." },
  { key: "primaryColor", label: "اللون الأساسي", placeholder: "#a26b1c" },
  { key: "email", label: "البريد الإلكتروني" },
  { key: "twitter", label: "رابط تويتر" },
  { key: "facebook", label: "رابط فيسبوك" },
  { key: "instagram", label: "رابط إنستغرام" },
  { key: "youtube", label: "رابط يوتيوب" },
  { key: "telegram", label: "رابط تليجرام" },
];

export default function SettingsAdmin() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings", { credentials: "include" }).then((r) => r.json()).then((j) => setValues(j?.data || {}));
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/settings", {
      method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: values }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <div className="text-gold-700 text-sm tracking-widest mb-2">التحكم</div>
        <h1 className="font-cairo text-3xl font-extrabold text-ink-900">إعدادات الموقع</h1>
      </div>

      <form onSubmit={onSave} className="card p-6 space-y-4" data-testid="settings-form">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="block text-xs text-ink-500 mb-1">{f.label}</span>
            <input
              value={values[f.key] || ""}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              placeholder={f.placeholder || ""}
              className="w-full bg-cream-50 border border-ink-900/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold-500"
              data-testid={`settings-${f.key}`}
            />
          </label>
        ))}
        <div className="flex items-center gap-3 pt-2">
          <button disabled={saving} className="btn-gold disabled:opacity-60" data-testid="settings-save-btn">{saving ? "جاري الحفظ..." : "حفظ التغييرات"}</button>
          {saved ? <span className="text-emerald-700 text-sm" data-testid="settings-saved">✓ تم الحفظ</span> : null}
        </div>
      </form>
    </div>
  );
}
