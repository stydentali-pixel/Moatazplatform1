import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { prisma } from "@/lib/prisma";

export const revalidate = 600;
export const metadata = { title: "الوسوم — معتز العلقمي" };

export default async function TagsPage() {
  let tags: Array<{ id: string; name: string; slug: string; _count: { posts: number } }> = [];
  let error = false;
  try {
    tags = await prisma.tag.findMany({
      orderBy: { name: "asc" },
      take: 100,
      select: { id: true, name: true, slug: true, _count: { select: { posts: true } } },
    });
  } catch (e) {
    console.error("Tags page error", e);
    error = true;
  }
  return (
    <>
      <SiteHeader />
      <section className="container-px mx-auto max-w-7xl py-14">
        <div className="mb-10">
          <div className="mb-2 text-sm tracking-widest text-gold-700">المنصّة</div>
          <h1 className="heading-sec">الوسوم</h1>
        </div>
        {error ? <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">تعذر تحميل الوسوم الآن.</div> : null}
        <div className="flex flex-wrap gap-3">
          {tags.map((t) => (
            <Link key={t.id} href={`/tags/${t.slug}`} className="chip px-5 py-2 text-base" data-testid={`tag-${t.slug}`}>
              #{t.name} <span className="ms-2 text-ink-500">({t._count.posts})</span>
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
