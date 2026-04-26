import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PostCard from "@/components/PostCard";
import NewsletterForm from "@/components/NewsletterForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let featured: any[] = [];
  let latest: any[] = [];
  let categories: any[] = [];
  let settings: any[] = [];

  try {
    [featured, latest, categories, settings] = await Promise.all([
      prisma.post.findMany({
        where: { status: "PUBLISHED", featured: true },
        orderBy: { publishedAt: "desc" },
        take: 3,
        select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, type: true, status: true, featured: true, views: true, readingTime: true, publishedAt: true, createdAt: true, category: { select: { name: true, slug: true } }, author: { select: { name: true } } },
      }),
      prisma.post.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 9,
        select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, type: true, status: true, featured: true, views: true, readingTime: true, publishedAt: true, createdAt: true, category: { select: { name: true, slug: true } }, author: { select: { name: true } } },
      }),
      prisma.category.findMany({
        orderBy: { name: "asc" },
        take: 10,
        include: { _count: { select: { posts: { where: { status: "PUBLISHED" } } } } },
      }),
      prisma.setting.findMany(),
    ]);
  } catch (error) {
    console.error("Home page data error", error);
  }

  const settingsMap: Record<string, string> = {};
  for (const s of settings) settingsMap[s.key] = s.value;

  const heroPost = featured[0] || latest[0];

  // type sections from the already fetched latest posts to reduce database load
  const articles = latest.filter((p) => p.type === "ARTICLE").slice(0, 3);
  const stories = latest.filter((p) => p.type === "STORY").slice(0, 3);

  return (
    <>
      <SiteHeader />

      {/* HERO */}
      <section className="relative pt-12 pb-20 overflow-hidden">
        <div className="absolute inset-0 -z-10 grain pointer-events-none" />
        <div className="container-px max-w-7xl mx-auto">
          <div className="grid md:grid-cols-12 gap-10 items-start">
            <div className="md:col-span-7 fade-up">
              <div className="flex items-center gap-3 mb-6 text-gold-700 text-sm">
                <span className="inline-block w-8 h-px bg-gold-700" />
                <span className="tracking-widest">{settingsMap.siteName || "معتز العلقمي"}</span>
              </div>
              <h1 className="font-cairo text-4xl md:text-6xl font-extrabold text-ink-900 leading-[1.15]">
                نصوصٌ تَعْلق<br/>في الذاكرة،<br/>
                <span className="text-gold-700 font-amiri italic">وتفكّر معك.</span>
              </h1>
              <p className="mt-6 text-lg text-ink-600 leading-9 max-w-xl">
                {settingsMap.siteDescription || "منصّة عربية للمقالات والقصص والإلهام — مختارة بعناية، مكتوبة لتُقرأ مرّتين."}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/posts" className="btn-gold" data-testid="hero-cta-explore">تصفّح الكتابات</Link>
                <Link href="/about" className="btn-ghost" data-testid="hero-cta-about">من معتز؟</Link>
              </div>
            </div>

            {heroPost ? (
              <div className="md:col-span-5 fade-up delay-2">
                <PostCard post={{ ...heroPost, publishedAt: heroPost.publishedAt as any, category: heroPost.category }} variant="feature" />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="gold-rule max-w-7xl mx-auto" />

      {/* FEATURED */}
      {featured.length > 0 ? (
        <section className="container-px max-w-7xl mx-auto py-20">
          <div className="flex items-end justify-between mb-10">
            <h2 className="heading-sec">المختار بعناية</h2>
            <Link href="/posts?sort=popular" className="text-sm text-ink-600 hover:text-gold-700">مزيد ←</Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {featured.map((p) => (
              <PostCard key={p.id} post={{ ...p, publishedAt: p.publishedAt as any, category: p.category }} />
            ))}
          </div>
        </section>
      ) : null}

      {/* LATEST */}
      <section className="container-px max-w-7xl mx-auto py-12">
        <div className="flex items-end justify-between mb-10">
          <h2 className="heading-sec">أحدث ما نُشر</h2>
          <Link href="/posts" className="text-sm text-ink-600 hover:text-gold-700">جميع المقالات ←</Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {latest.map((p) => (
            <PostCard key={p.id} post={{ ...p, publishedAt: p.publishedAt as any, category: p.category }} />
          ))}
          {latest.length === 0 ? (
            <div className="col-span-full text-center text-ink-500 py-20">لا توجد منشورات بعد.</div>
          ) : null}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container-px max-w-7xl mx-auto py-20">
        <h2 className="heading-sec mb-10">التصنيفات</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categories.map((c, idx) => (
            <Link
              key={c.id}
              href={`/categories/${c.slug}`}
              className="group relative rounded-2xl bg-cream-50 border border-ink-900/5 p-6 transition-all duration-500 hover:border-gold-500 hover:shadow-lg hover:-translate-y-1"
              data-testid={`category-card-${c.slug}`}
            >
              <div className="text-3xl font-amiri text-gold-700 mb-2">{String(idx + 1).padStart(2, "0")}</div>
              <div className="font-cairo font-bold text-ink-900 group-hover:text-gold-700 transition-colors">{c.name}</div>
              <div className="text-xs text-ink-500 mt-1">{c._count.posts} منشور</div>
            </Link>
          ))}
        </div>
      </section>

      {/* MIXED CONTENT */}
      {(articles.length > 0 || stories.length > 0) ? (
        <section className="container-px max-w-7xl mx-auto py-12 grid md:grid-cols-2 gap-12">
          {articles.length > 0 ? (
            <div>
              <h3 className="font-cairo text-2xl font-bold text-ink-900 mb-6 border-r-4 border-gold-500 pr-4">من المقالات</h3>
              <div className="space-y-6">
                {articles.map((p) => (
                  <PostCard key={p.id} post={{ ...p, publishedAt: p.publishedAt as any, category: p.category }} variant="compact" />
                ))}
              </div>
            </div>
          ) : null}
          {stories.length > 0 ? (
            <div>
              <h3 className="font-cairo text-2xl font-bold text-ink-900 mb-6 border-r-4 border-gold-500 pr-4">من القصص</h3>
              <div className="space-y-6">
                {stories.map((p) => (
                  <PostCard key={p.id} post={{ ...p, publishedAt: p.publishedAt as any, category: p.category }} variant="compact" />
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* NEWSLETTER STRIP */}
      <section className="container-px max-w-7xl mx-auto py-20">
        <div className="relative overflow-hidden rounded-3xl bg-ink-900 text-cream-50 px-8 md:px-16 py-14">
          <div className="absolute -left-20 -top-20 w-72 h-72 rounded-full bg-gold-700/30 blur-3xl pointer-events-none" />
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="text-gold-300 text-sm tracking-widest mb-3">النشرة البريدية</div>
              <h3 className="font-cairo text-3xl md:text-4xl font-bold">رسالة أسبوعية</h3>
              <p className="text-cream-100/80 mt-3 leading-8">جواهر مختارة، قراءات الأسبوع، وملاحظات لا تُنشر في أيّ مكان آخر.</p>
            </div>
            <div>
              <div className="bg-ink-800 rounded-2xl p-6">
                <NewsletterForm />
                <p className="text-xs text-cream-100/50 mt-3">لن نُرسل بريداً مزعجاً. ولن نشارك بريدك مع أحد.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
