import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PostCard from "@/components/PostCard";
import NewsletterForm from "@/components/NewsletterForm";
import { prisma } from "@/lib/prisma";
import { postCardSelect, sanitizePostCards } from "@/lib/content";
import { getSiteSettings } from "@/lib/settings";

// Public pages can be cached, but keep payload very small.
export const revalidate = 300;
export const dynamic = "force-static";

type HomeData = {
  featured: any[];
  latest: any[];
  categories: Array<{ id: string; name: string; slug: string; _count: { posts: number } }>;
  settings: Record<string, string>;
  error?: string;
};

async function getHomeData(): Promise<HomeData> {
  const fallback: HomeData = { featured: [], latest: [], categories: [], settings: {} };
  try {
    const [categories, settings, featuredRaw, latestRaw] = await Promise.all([
      prisma.category.findMany({
        orderBy: { name: "asc" },
        take: 8,
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { posts: { where: { status: "PUBLISHED" } } } },
        },
      }),
      getSiteSettings(),
      prisma.post.findMany({
        where: { status: "PUBLISHED", featured: true },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 4,
        select: postCardSelect,
      }),
      prisma.post.findMany({
        where: { status: "PUBLISHED" },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 8,
        select: postCardSelect,
      }),
    ]);

    return {
      categories,
      settings,
      featured: sanitizePostCards(featuredRaw),
      latest: sanitizePostCards(latestRaw),
    };
  } catch (error) {
    console.error("Home page data error", error);
    return { ...fallback, error: "نواجه ضغطاً كبيراً حالياً، قد لا تظهر بعض البيانات بشكل كامل." };
  }
}

export default async function HomePage() {
  const { featured, latest, categories, settings, error } = await getHomeData();
  const heroPost = featured[0] || latest[0];
  const articles = latest.filter((p) => p.type === "ARTICLE").slice(0, 4);
  const stories = latest.filter((p) => p.type === "STORY").slice(0, 4);

  return (
    <>
      <SiteHeader />

      {error ? (
        <div className="bg-amber-50 border-b border-amber-200 py-2 text-center text-sm text-amber-800">
          {error}
        </div>
      ) : null}

      <section className="relative overflow-hidden pt-10 pb-16 sm:pt-12 sm:pb-20">
        <div className="absolute inset-0 -z-10 grain pointer-events-none" />
        <div className="container-px mx-auto max-w-7xl">
          <div className="grid items-start gap-8 md:grid-cols-12 md:gap-10">
            <div className="fade-up md:col-span-7">
              <div className="mb-6 flex items-center gap-3 text-sm tracking-widest text-gold-700">
                <span className="inline-block h-px w-8 bg-gold-700" />
                <span>{settings.siteName || "معتز العلقمي"}</span>
              </div>
              <h1 className="font-cairo text-4xl font-extrabold leading-[1.15] text-ink-900 sm:text-5xl md:text-6xl">
                نصوصٌ تَعْلق<br />في الذاكرة،<br />
                <span className="font-amiri italic text-gold-700">وتفكّر معك.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-ink-600 sm:text-lg sm:leading-9">
                {settings.siteDescription || "منصّة عربية للمقالات والقصص والإلهام — مختارة بعناية، مكتوبة لتُقرأ مرّتين."}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/posts" className="btn-gold" data-testid="hero-cta-explore">تصفّح الكتابات</Link>
                <Link href="/about" className="btn-ghost" data-testid="hero-cta-about">من معتز؟</Link>
              </div>
            </div>

            {heroPost ? (
              <div className="fade-up delay-2 md:col-span-5">
                <PostCard post={heroPost} variant="feature" />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="gold-rule mx-auto max-w-7xl" />

      {featured.length > 0 ? (
        <section className="container-px mx-auto max-w-7xl py-14 sm:py-20">
          <div className="mb-10 flex items-end justify-between gap-4">
            <h2 className="heading-sec">المختار بعناية</h2>
            <Link href="/posts?sort=popular" className="text-sm text-ink-600 hover:text-gold-700">مزيد ←</Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        </section>
      ) : null}

      <section className="container-px mx-auto max-w-7xl py-12">
        <div className="mb-10 flex items-end justify-between gap-4">
          <h2 className="heading-sec">أحدث ما نُشر</h2>
          <Link href="/posts" className="text-sm text-ink-600 hover:text-gold-700">جميع المقالات ←</Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {latest.map((p) => <PostCard key={p.id} post={p} />)}
          {latest.length === 0 && !error ? <div className="col-span-full py-20 text-center text-ink-500">لا توجد منشورات بعد.</div> : null}
        </div>
      </section>

      {categories.length > 0 ? (
        <section className="container-px mx-auto max-w-7xl py-14 sm:py-20">
          <h2 className="heading-sec mb-10">التصنيفات</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {categories.map((c, idx) => (
              <Link key={c.id} href={`/categories/${c.slug}`} className="group relative rounded-2xl border border-ink-900/5 bg-cream-50 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-gold-500 hover:shadow-lg sm:p-6" data-testid={`category-card-${c.slug}`}>
                <div className="mb-2 font-amiri text-3xl text-gold-700">{String(idx + 1).padStart(2, "0")}</div>
                <div className="font-cairo font-bold text-ink-900 transition-colors group-hover:text-gold-700">{c.name}</div>
                <div className="mt-1 text-xs text-ink-500">{c._count.posts} منشور</div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {articles.length > 0 || stories.length > 0 ? (
        <section className="container-px mx-auto grid max-w-7xl gap-10 py-12 md:grid-cols-2 md:gap-12">
          {articles.length > 0 ? (
            <div>
              <h3 className="mb-6 border-r-4 border-gold-500 pr-4 font-cairo text-2xl font-bold text-ink-900">من المقالات</h3>
              <div className="space-y-6">{articles.map((p) => <PostCard key={p.id} post={p} variant="compact" />)}</div>
            </div>
          ) : null}
          {stories.length > 0 ? (
            <div>
              <h3 className="mb-6 border-r-4 border-gold-500 pr-4 font-cairo text-2xl font-bold text-ink-900">من القصص</h3>
              <div className="space-y-6">{stories.map((p) => <PostCard key={p.id} post={p} variant="compact" />)}</div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="container-px mx-auto max-w-7xl py-14 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl bg-ink-900 px-6 py-10 text-cream-50 sm:px-8 md:px-16 md:py-14">
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-gold-700/30 blur-3xl" />
          <div className="relative grid items-center gap-8 md:grid-cols-2">
            <div>
              <div className="mb-3 text-sm tracking-widest text-gold-300">النشرة البريدية</div>
              <h3 className="font-cairo text-3xl font-bold md:text-4xl">رسالة أسبوعية</h3>
              <p className="mt-3 leading-8 text-cream-100/80">جواهر مختارة، قراءات الأسبوع، وملاحظات لا تُنشر في أيّ مكان آخر.</p>
            </div>
            <div className="rounded-2xl bg-ink-800 p-5 sm:p-6">
              <NewsletterForm />
              <p className="mt-3 text-xs text-cream-100/50">لن نُرسل بريداً مزعجاً. ولن نشارك بريدك مع أحد.</p>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
