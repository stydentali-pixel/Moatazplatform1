import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PostCard from "@/components/PostCard";
import PostsFilters from "@/components/PostsFilters";
import { prisma } from "@/lib/prisma";

export const revalidate = 1800; // 30 minutes

export const metadata = {
  title: "المقالات — معتز العلقمي",
  description: "تصفّح كل المقالات والقصص والمحتوى المنشور على المنصة.",
};

export default async function PostsPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const type = searchParams.type;
  const sort = searchParams.sort || "latest";
  const page = Math.max(1, parseInt(searchParams.page || "1", 10));
  const limit = 12;

  const where: any = { status: "PUBLISHED" };
  if (type) where.type = type;

  const orderBy =
    sort === "popular" ? [{ views: "desc" as const }, { publishedAt: "desc" as const }] : [{ publishedAt: "desc" as const }];

  let items: any[] = [];
  let total = 0;
  let errorOccurred = false;

  try {
    [items, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          type: true,
          status: true,
          publishedAt: true,
          readingTime: true,
          category: { select: { id: true, name: true, slug: true } },
          author: { select: { id: true, name: true } }
        },
      }),
      prisma.post.count({ where }),
    ]);
  } catch (error) {
    console.error("Posts page data error", error);
    errorOccurred = true;
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (type) u.set("type", type);
    if (sort !== "latest") u.set("sort", sort);
    u.set("page", String(p));
    return u.toString();
  };

  return (
    <>
      <SiteHeader />
      <section className="container-px max-w-7xl mx-auto py-14">
        <div className="mb-10">
          <div className="text-gold-700 text-sm tracking-widest mb-2">الأرشيف</div>
          <h1 className="heading-sec">المقالات والمنشورات</h1>
          {!errorOccurred && <p className="mt-4 text-ink-600">عثرت على {total} منشور.</p>}
        </div>
        
        <PostsFilters />

        {errorOccurred && (
          <div className="mb-10 rounded-2xl bg-amber-50 border border-amber-200 p-6 text-center">
            <p className="text-amber-800">نواجه صعوبة في تحميل القائمة كاملة حالياً. يرجى المحاولة مرة أخرى لاحقاً.</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((p) => (
            <PostCard key={p.id} post={{ ...p, publishedAt: p.publishedAt as any, category: p.category }} />
          ))}
          {items.length === 0 && !errorOccurred ? (
            <div className="col-span-full text-center text-ink-500 py-20">لا توجد منشورات مطابقة.</div>
          ) : null}
        </div>

        {!errorOccurred && totalPages > 1 ? (
          <div className="flex items-center justify-center gap-2 mt-12" data-testid="pagination">
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              return (
                <Link
                  key={p}
                  href={`/posts?${qs(p)}`}
                  className={`w-10 h-10 inline-flex items-center justify-center rounded-full text-sm transition-colors ${
                    p === page ? "bg-gold-700 text-cream-50" : "bg-cream-50 border border-ink-900/10 text-ink-700 hover:border-gold-500"
                  }`}
                  data-testid={`pagination-page-${p}`}
                >
                  {p}
                </Link>
              );
            })}
          </div>
        ) : null}
      </section>
      <SiteFooter />
    </>
  );
}
