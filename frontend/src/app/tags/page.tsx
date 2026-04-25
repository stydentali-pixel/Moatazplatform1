import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = { title: "الوسوم — معتز العلقمي" };

export default async function TagsPage() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });
  return (
    <>
      <SiteHeader />
      <section className="container-px max-w-7xl mx-auto py-14">
        <div className="mb-10">
          <div className="text-gold-700 text-sm tracking-widest mb-2">المنصّة</div>
          <h1 className="heading-sec">الوسوم</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          {tags.map((t) => (
            <Link key={t.id} href={`/tags/${t.slug}`} className="chip text-base px-5 py-2" data-testid={`tag-${t.slug}`}>
              #{t.name} <span className="text-ink-500 ms-2">({t._count.posts})</span>
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
