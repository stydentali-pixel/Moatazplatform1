import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { prisma } from "@/lib/prisma";

export const revalidate = 600;
export const metadata = { title: "التصنيفات — معتز العلقمي" };

export default async function CategoriesPage() {
  let cats: Array<{ id: string; name: string; slug: string; description: string | null; _count: { posts: number } }> = [];
  let error = false;
  try {
    cats = await prisma.category.findMany({
      orderBy: { name: "asc" },
      take: 50,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        _count: { select: { posts: { where: { status: "PUBLISHED" } } } },
      },
    });
  } catch (e) {
    console.error("Categories page error", e);
    error = true;
  }

  return (
    <>
      <SiteHeader />
      <section className="container-px mx-auto max-w-7xl py-14">
        <div className="mb-10">
          <div className="mb-2 text-sm tracking-widest text-gold-700">المنصّة</div>
          <h1 className="heading-sec">التصنيفات</h1>
          <p className="mt-4 text-ink-600">اختر تصنيفاً لاكتشاف ما يهمّك.</p>
        </div>
        {error ? <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">تعذر تحميل التصنيفات الآن.</div> : null}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((c, idx) => (
            <Link key={c.id} href={`/categories/${c.slug}`} className="card group p-6 sm:p-7" data-testid={`category-${c.slug}`}>
              <div className="mb-3 font-amiri text-3xl text-gold-700">{String(idx + 1).padStart(2, "0")}</div>
              <h3 className="font-cairo text-2xl font-bold text-ink-900 transition-colors group-hover:text-gold-700">{c.name}</h3>
              {c.description ? <p className="mt-2 text-sm leading-7 text-ink-600">{c.description}</p> : null}
              <div className="mt-4 text-xs text-ink-500">{c._count.posts} منشور</div>
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
