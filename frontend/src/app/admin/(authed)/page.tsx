import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

type DashboardCounts = {
  total: number;
  published: number;
  drafts: number;
  scheduled: number;
  categories: number;
  tags: number;
  ideas: number;
};

type RecentPost = {
  id: string;
  title: string;
  status: string;
  updatedAt: Date;
  author?: { name: string } | null;
  category?: { name: string } | null;
};

async function getDashboardData(): Promise<{ counts: DashboardCounts; recent: RecentPost[]; error?: string }> {
  const empty: DashboardCounts = { total: 0, published: 0, drafts: 0, scheduled: 0, categories: 0, tags: 0, ideas: 0 };

  try {
    const [rows, recent] = await Promise.all([
      prisma.$queryRaw<Array<DashboardCounts>>`
        select
          (select count(*)::int from "Post") as total,
          (select count(*)::int from "Post" where status = 'PUBLISHED') as published,
          (select count(*)::int from "Post" where status = 'DRAFT') as drafts,
          (select count(*)::int from "Post" where status = 'SCHEDULED') as scheduled,
          (select count(*)::int from "Category") as categories,
          (select count(*)::int from "Tag") as tags,
          (select count(*)::int from "ArticleIdea") as ideas
      `,
      prisma.post.findMany({
        take: 6,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          updatedAt: true,
          author: { select: { name: true } },
          category: { select: { name: true } },
        },
      }),
    ]);

    return { counts: rows[0] || empty, recent };
  } catch (error) {
    console.error("Admin dashboard data error", error);
    return { counts: empty, recent: [], error: "تعذّر تحميل إحصائيات لوحة التحكم الآن. جرّب تحديث الصفحة بعد لحظات." };
  }
}

export default async function AdminDashboard() {
  const { counts, recent, error } = await getDashboardData();

  const stats = [
    { label: "إجمالي المنشورات", value: counts.total, color: "from-gold-600 to-gold-800" },
    { label: "منشور", value: counts.published, color: "from-emerald-600 to-emerald-800" },
    { label: "مسوّدات", value: counts.drafts, color: "from-amber-500 to-amber-700" },
    { label: "مجدولة", value: counts.scheduled, color: "from-blue-600 to-blue-800" },
    { label: "التصنيفات", value: counts.categories, color: "from-purple-600 to-purple-800" },
    { label: "الوسوم", value: counts.tags, color: "from-pink-600 to-pink-800" },
    { label: "أفكار المقالات", value: counts.ideas, color: "from-rose-600 to-rose-800" },
  ];

  const STATUS_AR: Record<string, string> = { DRAFT: "مسودة", PUBLISHED: "منشور", SCHEDULED: "مجدول", ARCHIVED: "مؤرشف" };

  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-10">
        <div className="mb-2 text-sm tracking-widest text-gold-700">لوحة التحكم</div>
        <h1 className="font-cairo text-2xl font-extrabold text-ink-900 sm:text-3xl md:text-4xl">أهلاً بك من جديد</h1>
        <p className="mt-2 text-sm text-ink-600 sm:text-base">نظرة عامّة على المنصّة وآخر التحديثات.</p>
      </div>

      {error ? <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${s.color} p-4 text-cream-50 sm:p-6`} data-testid={`stat-${s.label}`}>
            <div className="font-cairo text-2xl font-extrabold sm:text-3xl">{s.value}</div>
            <div className="mt-1 text-xs opacity-90 sm:text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-cairo text-lg font-bold text-ink-900 sm:text-xl">آخر المنشورات</h2>
            <Link href="/admin/posts" className="shrink-0 text-sm text-gold-700 hover:underline">الكل ←</Link>
          </div>
          <div className="space-y-3">
            {recent.map((p) => (
              <Link key={p.id} href={`/admin/posts/${p.id}`} className="flex flex-col gap-2 rounded-xl p-3 transition-colors hover:bg-cream-100 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="line-clamp-1 font-cairo font-bold text-ink-900">{p.title}</div>
                  <div className="mt-1 text-xs text-ink-500">{p.author?.name} {p.category ? `· ${p.category.name}` : ""}</div>
                </div>
                <span className={`w-fit rounded-full px-2 py-1 text-xs ${
                  p.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-800" :
                  p.status === "DRAFT" ? "bg-amber-100 text-amber-800" :
                  p.status === "SCHEDULED" ? "bg-blue-100 text-blue-800" : "bg-ink-100 text-ink-700"
                }`}>{STATUS_AR[p.status] || p.status}</span>
              </Link>
            ))}
            {recent.length === 0 ? <div className="py-10 text-center text-ink-500">لا توجد منشورات بعد</div> : null}
          </div>
        </div>

        <div className="card p-4 sm:p-6">
          <h2 className="mb-4 font-cairo text-lg font-bold text-ink-900 sm:text-xl">إجراءات سريعة</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/admin/posts/new" className="rounded-xl border border-ink-900/10 p-4 transition-colors hover:border-gold-500 hover:bg-cream-50">
              <div className="font-cairo font-bold text-ink-900">+ مقال جديد</div>
              <div className="mt-1 text-xs text-ink-500">ابدأ كتابة مقال أو قصّة</div>
            </Link>
            <Link href="/admin/ideas" className="rounded-xl border border-ink-900/10 p-4 transition-colors hover:border-gold-500 hover:bg-cream-50">
              <div className="font-cairo font-bold text-ink-900">أفكار المقالات</div>
              <div className="mt-1 text-xs text-ink-500">حوّل فكرة إلى مسوّدة</div>
            </Link>
            <Link href="/admin/media" className="rounded-xl border border-ink-900/10 p-4 transition-colors hover:border-gold-500 hover:bg-cream-50">
              <div className="font-cairo font-bold text-ink-900">رفع وسائط</div>
              <div className="mt-1 text-xs text-ink-500">صور وأغلفة</div>
            </Link>
            <Link href="/admin/settings" className="rounded-xl border border-ink-900/10 p-4 transition-colors hover:border-gold-500 hover:bg-cream-50">
              <div className="font-cairo font-bold text-ink-900">إعدادات الموقع</div>
              <div className="mt-1 text-xs text-ink-500">الاسم والروابط</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
