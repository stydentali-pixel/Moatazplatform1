import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PostCard from "@/components/PostCard";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600; // 1 hour

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  let cat: any = null;
  let posts: any[] = [];
  let errorOccurred = false;

  try {
    cat = await prisma.category.findUnique({ 
      where: { slug: params.slug },
      select: { id: true, name: true, description: true }
    });
    
    if (cat) {
      posts = await prisma.post.findMany({
        where: { status: "PUBLISHED", categoryId: cat.id },
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          type: true,
          status: true,
          featured: true,
          views: true,
          readingTime: true,
          publishedAt: true,
          category: { select: { name: true, slug: true } },
          author: { select: { name: true } }
        },
      });
    }
  } catch (error) {
    console.error("Category page error", error);
    errorOccurred = true;
  }

  if (!cat && !errorOccurred) notFound();

  return (
    <>
      <SiteHeader />
      <section className="container-px max-w-7xl mx-auto py-14">
        <div className="mb-10">
          <div className="text-gold-700 text-sm tracking-widest mb-2">تصنيف</div>
          <h1 className="heading-sec">{cat?.name || "التصنيف"}</h1>
          {cat?.description ? <p className="mt-4 text-ink-600">{cat.description}</p> : null}
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
            <div className="col-span-full text-center text-ink-500 py-20">لا توجد منشورات في هذا التصنيف بعد.</div>
          ) : null}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
