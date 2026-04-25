import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = { title: "التصنيفات — معتز العلقمي" };

export default async function CategoriesPage() {
  const cats = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: { where: { status: "PUBLISHED" } } } } },
  });

  return (
    <>
      <SiteHeader />
      <section className="container-px max-w-7xl mx-auto py-14">
        <div className="mb-10">
          <div className="text-gold-700 text-sm tracking-widest mb-2">المنصّة</div>
          <h1 className="heading-sec">التصنيفات</h1>
          <p className="mt-4 text-ink-600">اختر تصنيفاً لاكتشاف ما يهمّك.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {cats.map((c, idx) => (
            <Link key={c.id} href={`/categories/${c.slug}`} className="card p-7 group" data-testid={`category-${c.slug}`}>
              <div className="font-amiri text-gold-700 text-3xl mb-3">{String(idx + 1).padStart(2, "0")}</div>
              <h3 className="font-cairo font-bold text-2xl text-ink-900 group-hover:text-gold-700 transition-colors">{c.name}</h3>
              {c.description ? <p className="mt-2 text-ink-600 text-sm leading-7">{c.description}</p> : null}
              <div className="mt-4 text-xs text-ink-500">{c._count.posts} منشور</div>
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
