import { headers } from "next/headers";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-10">
      <div className="text-center max-w-md">
        <div className="font-amiri text-gold-700 text-7xl mb-4">٤٠٤</div>
        <h1 className="font-cairo text-3xl font-extrabold text-ink-900 mb-3">الصفحة لم تُكتب بعد</h1>
        <p className="text-ink-600 leading-8">قد تكون قد حُذفت أو لم تُنشَأ. عُد إلى الرئيسية.</p>
        <a href="/" className="btn-gold mt-6 inline-flex">العودة للرئيسية</a>
      </div>
    </main>
  );
}
