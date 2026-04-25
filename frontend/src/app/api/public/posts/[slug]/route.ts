import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const post = await prisma.post.findFirst({
    where: { slug: params.slug, status: "PUBLISHED" },
    include: {
      author: { select: { id: true, name: true, bio: true, avatar: true } },
      category: { select: { id: true, name: true, slug: true } },
      tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
    },
  });
  if (!post) return fail("المقال غير موجود", 404);

  // Increment views (fire and forget)
  prisma.post.update({ where: { id: post.id }, data: { views: { increment: 1 } } }).catch(() => null);

  // Related: same category, exclude self
  const related = await prisma.post.findMany({
    where: { id: { not: post.id }, status: "PUBLISHED", categoryId: post.categoryId },
    take: 3,
    orderBy: { publishedAt: "desc" },
    select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, type: true, publishedAt: true, readingTime: true },
  });

  return ok({
    post: { ...post, tags: post.tags.map((pt) => pt.tag) },
    related,
  });
}
