"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DEFAULT_ICON_URL } from "@/lib/content";

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const j = await r.json();
      if (!r.ok || !j.success) {
        setError(typeof j.error === "string" ? j.error : "فشل تسجيل الدخول");
        return;
      }
      const from = sp.get("from") || "/admin";
      router.push(from);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm" data-testid="admin-login-form">
      <div className="text-gold-700 text-sm tracking-widest mb-2">دخول</div>
      <h1 className="font-cairo text-3xl font-extrabold text-ink-900 mb-8">تسجيل الدخول</h1>

      <label className="block mb-5">
        <span className="block text-sm text-ink-700 mb-2">البريد الإلكتروني</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-cream-50 border border-ink-900/10 rounded-xl px-4 py-3 text-ink-900 focus:outline-none focus:border-gold-500"
          data-testid="login-email-input"
        />
      </label>
      <label className="block mb-6">
        <span className="block text-sm text-ink-700 mb-2">كلمة المرور</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full bg-cream-50 border border-ink-900/10 rounded-xl px-4 py-3 text-ink-900 focus:outline-none focus:border-gold-500"
          data-testid="login-password-input"
        />
      </label>

      {error ? (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3" data-testid="login-error">
          {error}
        </div>
      ) : null}

      <button type="submit" disabled={loading} className="btn-gold w-full disabled:opacity-60" data-testid="login-submit-btn">
        {loading ? "..." : "دخول"}
      </button>
    </form>
  );
}

export default function AdminLogin() {
  return (
    <main className="min-h-screen grid md:grid-cols-2">
      <div className="bg-ink-900 text-cream-50 p-10 md:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gold-700/30 blur-3xl pointer-events-none" />
        <Link href="/" className="flex items-center gap-3 relative z-10" data-testid="login-logo-link">
          <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-gold-300/30">
            <img src={DEFAULT_ICON_URL} alt="منصة معتز" className="h-full w-full object-cover" />
          </span>
          <div className="font-cairo font-bold text-lg">منصة معتز</div>
        </Link>
        <div className="relative z-10">
          <div className="font-amiri text-gold-300 text-2xl mb-3">"اكتب كأنّك تنحت."</div>
          <p className="text-cream-100/70 leading-9 max-w-md">
            لوحة التحكم — حيث تتشكّل الكلمات قبل أن تصل إلى القرّاء. كل ما تنشره هنا، يُؤرّخ.
          </p>
        </div>
        <div className="relative z-10 text-cream-100/40 text-xs">© {new Date().getFullYear()} لوحة الإدارة</div>
      </div>

      <div className="flex items-center justify-center p-10">
        <Suspense fallback={<div className="text-ink-500">...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
