import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [total, published, drafts, scheduled, categories, tags, ideas, recent] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { status: "PUBLISHED" } }),
    prisma.post.count({ where: { status: "DRAFT" } }),
    prisma.post.count({ where: { status: "SCHEDULED" } }),
    prisma.category.count(),
    prisma.tag.count(),
    prisma.articleIdea.count(),
    prisma.post.findMany({
      take: 6,
      orderBy: { updatedAt: "desc" },
      include: { author: { select: { name: true } }, category: { select: { name: true } } },
    }),
  ]);

  const stats = [
    { label: "إجمالي المنشورات", value: total, color: "from-gold-600 to-gold-800" },
    { label: "منشور", value: published, color: "from-emerald-600 to-emerald-800" },
    { label: "مسوّدات", value: drafts, color: "from-amber-500 to-amber-700" },
    { label: "مجدولة", value: scheduled, color: "from-blue-600 to-blue-800" },
    { label: "التصنيفات", value: categories, color: "from-purple-600 to-purple-800" },
    { label: "الوسوم", value: tags, color: "from-pink-600 to-pink-800" },
    { label: "أفكار المقالات", value: ideas, color: "from-rose-600 to-rose-800" },
  ];

  const STATUS_AR: Record<string, string> = { DRAFT: "مسودة", PUBLISHED: "منشور", SCHEDULED: "مجدول", ARCHIVED: "مؤرشف" };

  return (
    <div className="max-w-6xl">
      <div className="mb-10">
        <div className="text-gold-700 text-sm tracking-widest mb-2">لوحة التحكم</div>
        <h1 className="font-cairo text-3xl md:text-4xl font-extrabold text-ink-900">أهلاً بك من جديد</h1>
        <p className="text-ink-600 mt-2">نظرة عامّة على المنصّة وآخر التحديثات.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${s.color} text-cream-50 p-6`} data-testid={`stat-${s.label}`}>
            <div className="text-3xl font-extrabold font-cairo">{s.value}</div>
            <div className="text-sm opacity-90 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-cairo font-bold text-xl text-ink-900">آخر المنشورات</h2>
            <Link href="/admin/posts" className="text-sm text-gold-700 hover:underline">الكل ←</Link>
          </div>
          <div className="space-y-3">
            {recent.map((p) => (
              <Link key={p.id} href={`/admin/posts/${p.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-cream-100 transition-colors">
                <div>
                  <div className="font-cairo font-bold text-ink-900 line-clamp-1">{p.title}</div>
                  <div className="text-xs text-ink-500 mt-1">{p.author?.name} {p.category ? `· ${p.category.name}` : ""}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  p.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-800" :
                  p.status === "DRAFT" ? "bg-amber-100 text-amber-800" :
                  p.status === "SCHEDULED" ? "bg-blue-100 text-blue-800" : "bg-ink-100 text-ink-700"
                }`}>{STATUS_AR[p.status] || p.status}</span>
              </Link>
            ))}
            {recent.length === 0 ? <div className="text-center text-ink-500 py-10">لا توجد منشورات بعد</div> : null}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-cairo font-bold text-xl text-ink-900 mb-4">إجراءات سريعة</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/posts/new" className="p-4 rounded-xl border border-ink-900/10 hover:border-gold-500 hover:bg-cream-50 transition-colors">
              <div className="font-cairo font-bold text-ink-900">+ مقال جديد</div>
              <div className="text-xs text-ink-500 mt-1">ابدأ كتابة مقال أو قصّة</div>
            </Link>
            <Link href="/admin/ideas" className="p-4 rounded-xl border border-ink-900/10 hover:border-gold-500 hover:bg-cream-50 transition-colors">
              <div className="font-cairo font-bold text-ink-900">أفكار المقالات</div>
              <div className="text-xs text-ink-500 mt-1">حوّل فكرة إلى مسوّدة</div>
            </Link>
            <Link href="/admin/media" className="p-4 rounded-xl border border-ink-900/10 hover:border-gold-500 hover:bg-cream-50 transition-colors">
              <div className="font-cairo font-bold text-ink-900">رفع وسائط</div>
              <div className="text-xs text-ink-500 mt-1">صور وأغلفة</div>
            </Link>
            <Link href="/admin/settings" className="p-4 rounded-xl border border-ink-900/10 hover:border-gold-500 hover:bg-cream-50 transition-colors">
              <div className="font-cairo font-bold text-ink-900">إعدادات الموقع</div>
              <div className="text-xs text-ink-500 mt-1">الاسم والروابط</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
