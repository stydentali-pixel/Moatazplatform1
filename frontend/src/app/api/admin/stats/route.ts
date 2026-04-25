import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";

export async function GET() {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);

  const [total, published, drafts, scheduled, archived, categories, tags, ideas, media] =
    await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { status: "PUBLISHED" } }),
      prisma.post.count({ where: { status: "DRAFT" } }),
      prisma.post.count({ where: { status: "SCHEDULED" } }),
      prisma.post.count({ where: { status: "ARCHIVED" } }),
      prisma.category.count(),
      prisma.tag.count(),
      prisma.articleIdea.count(),
      prisma.media.count(),
    ]);

  const recent = await prisma.post.findMany({
    take: 6,
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, slug: true, status: true, type: true, updatedAt: true },
  });

  return ok({
    counts: { total, published, drafts, scheduled, archived, categories, tags, ideas, media },
    recent,
  });
}
