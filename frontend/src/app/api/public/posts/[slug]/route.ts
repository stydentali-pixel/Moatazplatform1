import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { postCardSelect, sanitizePostCards, safeImageUrl, truncateHtml } from "@/lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const post = await prisma.post.findFirst({
      where: { slug: params.slug, status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        coverImage: true,
        type: true,
        publishedAt: true,
        readingTime: true,
        views: true,
        author: { select: { id: true, name: true, bio: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true } },
        tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
      },
    });
    if (!post) return fail("المقال غير موجود", 404);

    prisma.post.update({ where: { id: post.id }, data: { views: { increment: 1 } } }).catch(() => null);

    const related = sanitizePostCards(await prisma.post.findMany({
      where: { id: { not: post.id }, status: "PUBLISHED", categoryId: post.category?.id },
      take: 3,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: postCardSelect,
    }));

    return ok({
      post: {
        ...post,
        coverImage: safeImageUrl(post.coverImage),
        content: truncateHtml(post.content),
        tags: post.tags.map((pt) => pt.tag),
      },
      related,
    });
  } catch (error) {
    console.error("Public post read error", error);
    return fail("تعذر تحميل المقال الآن", 503);
  }
}
