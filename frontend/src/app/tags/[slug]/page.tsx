import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PostCard from "@/components/PostCard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TagPage({ params }: { params: { slug: string } }) {
  const tag = await prisma.tag.findUnique({ where: { slug: params.slug } });
  if (!tag) notFound();
  const links = await prisma.postTag.findMany({
    where: { tagId: tag.id },
    include: {
      post: {
        include: { category: true },
      },
    },
  });
  const posts = links.map((l) => l.post).filter((p) => p.status === "PUBLISHED");
  return (
    <>
      <SiteHeader />
      <section className="container-px max-w-7xl mx-auto py-14">
        <div className="mb-10">
          <div className="text-gold-700 text-sm tracking-widest mb-2">وسم</div>
          <h1 className="heading-sec">#{tag.name}</h1>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((p) => (
            <PostCard key={p.id} post={{ ...p, publishedAt: p.publishedAt as any, category: p.category }} />
          ))}
          {posts.length === 0 ? <div className="col-span-full text-center text-ink-500 py-20">لا توجد منشورات بهذا الوسم بعد.</div> : null}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
