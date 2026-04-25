import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PostCard from "@/components/PostCard";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  ARTICLE: "مقال",
  STORY: "قصة",
  LINK: "رابط",
  IMAGE: "صورة",
  VIDEO: "فيديو",
  QUOTE: "اقتباس",
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await prisma.post.findUnique({ where: { slug: params.slug } });
  if (!post) return { title: "غير موجود" };
  return {
    title: `${post.seoTitle || post.title} — معتز العلقمي`,
    description: post.seoDescription || post.excerpt || undefined,
    alternates: post.canonicalUrl ? { canonical: post.canonicalUrl } : undefined,
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || undefined,
      images: post.coverImage ? [post.coverImage] : undefined,
      type: "article",
    },
    twitter: { card: "summary_large_image", title: post.seoTitle || post.title, description: post.seoDescription || post.excerpt || undefined, images: post.coverImage ? [post.coverImage] : undefined },
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await prisma.post.findFirst({
    where: { slug: params.slug, status: "PUBLISHED" },
    include: {
      author: { select: { name: true, bio: true, avatar: true, id: true } },
      category: true,
      tags: { include: { tag: true } },
    },
  });
  if (!post) notFound();

  // increment views (background)
  prisma.post.update({ where: { id: post.id }, data: { views: { increment: 1 } } }).catch(() => null);

  const related = await prisma.post.findMany({
    where: { status: "PUBLISHED", id: { not: post.id }, categoryId: post.categoryId },
    take: 3,
    orderBy: { publishedAt: "desc" },
    include: { category: true },
  });

  const date = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" }) : "";

  return (
    <>
      <SiteHeader />
      <article className="container-px max-w-3xl mx-auto py-12">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 text-sm text-gold-700 mb-4">
            <span>{TYPE_LABELS[post.type] || post.type}</span>
            {post.category ? (
              <>
                <span className="opacity-50">·</span>
                <Link href={`/categories/${post.category.slug}`} className="hover:underline">{post.category.name}</Link>
              </>
            ) : null}
          </div>
          <h1 className="font-cairo text-3xl md:text-5xl font-extrabold text-ink-900 leading-tight" data-testid="post-title">
            {post.title}
          </h1>
          {post.excerpt ? <p className="mt-5 text-lg text-ink-600 leading-9">{post.excerpt}</p> : null}
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-ink-500">
            <span>{post.author.name}</span>
            {date ? <><span>·</span><span>{date}</span></> : null}
            {post.readingTime ? <><span>·</span><span>{post.readingTime} د قراءة</span></> : null}
          </div>
        </div>
      </article>

      {post.coverImage ? (
        <div className="container-px max-w-5xl mx-auto">
          <img src={post.coverImage} alt={post.title} className="w-full rounded-3xl aspect-[16/9] object-cover" />
        </div>
      ) : null}

      <article className="container-px max-w-3xl mx-auto py-12">
        <div className="prose-rtl" data-testid="post-content" dangerouslySetInnerHTML={{ __html: post.content }} />

        {post.tags.length > 0 ? (
          <div className="mt-10 flex flex-wrap gap-2">
            {post.tags.map((pt) => (
              <Link key={pt.tag.id} href={`/tags/${pt.tag.slug}`} className="chip" data-testid={`post-tag-${pt.tag.slug}`}>
                #{pt.tag.name}
              </Link>
            ))}
          </div>
        ) : null}

        {/* Author */}
        <div className="mt-14 p-6 rounded-2xl bg-cream-100 border border-ink-900/5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-gold-700 flex items-center justify-center flex-shrink-0">
              <span className="text-cream-50 font-amiri text-2xl">{post.author.name.charAt(0)}</span>
            </div>
            <div>
              <div className="font-cairo font-bold text-ink-900">{post.author.name}</div>
              {post.author.bio ? <p className="text-ink-600 mt-1 text-sm leading-7">{post.author.bio}</p> : null}
            </div>
          </div>
        </div>
      </article>

      {related.length > 0 ? (
        <section className="container-px max-w-7xl mx-auto py-12">
          <h2 className="heading-sec mb-8">قراءات ذات صلة</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {related.map((p) => (
              <PostCard key={p.id} post={{ ...p, publishedAt: p.publishedAt as any, category: p.category }} />
            ))}
          </div>
        </section>
      ) : null}

      <SiteFooter />
    </>
  );
}
