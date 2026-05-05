import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PostCard from "@/components/PostCard";
import { prisma } from "@/lib/prisma";
import { postCardSelect, sanitizePostCards } from "@/lib/content";

export const revalidate = 300;

export default async function TagPage({ params }: { params: { slug: string } }) {
  let tag: any = null;
  let posts: any[] = [];
  let errorOccurred = false;

  try {
    tag = await prisma.tag.findUnique({ 
      where: { slug: params.slug },
      select: { id: true, name: true }
    });
    
    if (tag) {
      const links = await prisma.postTag.findMany({
        where: { 
          tagId: tag.id,
          post: { status: "PUBLISHED" }
        },
        take: 24, // Safety limit
        select: {
          post: {
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
            }
          },
        },
        orderBy: { post: { publishedAt: "desc" } }
      });
      posts = sanitizePostCards(links.map((l: any) => l.post));
    }
  } catch (error) {
    console.error("Tag page error", error);
    errorOccurred = true;
  }

  if (!tag && !errorOccurred) notFound();

  return (
    <>
      <SiteHeader />
      <section className="container-px max-w-7xl mx-auto py-14">
        <div className="mb-10">
          <div className="text-gold-700 text-sm tracking-widest mb-2">وسم</div>
          <h1 className="heading-sec">#{tag?.name || "الوسم"}</h1>
        </div>

        {errorOccurred && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center text-amber-800 mb-10">
            نواجه صعوبة في تحميل المحتوى حالياً.
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((p) => (
            <PostCard key={p.id} post={{ ...p, publishedAt: p.publishedAt as any, category: p.category }} />
          ))}
          {posts.length === 0 && !errorOccurred ? (
            <div className="col-span-full text-center text-ink-500 py-20">لا توجد منشورات بهذا الوسم بعد.</div>
          ) : null}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
