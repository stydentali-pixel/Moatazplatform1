import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PostCard from "@/components/PostCard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const cat = await prisma.category.findUnique({ where: { slug: params.slug } });
  if (!cat) notFound();
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED", categoryId: cat.id },
    orderBy: { publishedAt: "desc" },
    include: { category: true },
  });

  return (
    <>
      <SiteHeader />
      <section className="container-px max-w-7xl mx-auto py-14">
        <div className="mb-10">
          <div className="text-gold-700 text-sm tracking-widest mb-2">تصنيف</div>
          <h1 className="heading-sec">{cat.name}</h1>
          {cat.description ? <p className="mt-4 text-ink-600">{cat.description}</p> : null}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((p) => (
            <PostCard key={p.id} post={{ ...p, publishedAt: p.publishedAt as any, category: p.category }} />
          ))}
          {posts.length === 0 ? <div className="col-span-full text-center text-ink-500 py-20">لا توجد منشورات في هذا التصنيف بعد.</div> : null}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
