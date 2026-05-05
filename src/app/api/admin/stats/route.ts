import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);

  try {
    const [rows, recent] = await Promise.all([
      prisma.$queryRaw<Array<{
        total: number;
        published: number;
        drafts: number;
        scheduled: number;
        archived: number;
        categories: number;
        tags: number;
        ideas: number;
        media: number;
      }>>`
        select
          (select count(*)::int from "Post") as total,
          (select count(*)::int from "Post" where status = 'PUBLISHED') as published,
          (select count(*)::int from "Post" where status = 'DRAFT') as drafts,
          (select count(*)::int from "Post" where status = 'SCHEDULED') as scheduled,
          (select count(*)::int from "Post" where status = 'ARCHIVED') as archived,
          (select count(*)::int from "Category") as categories,
          (select count(*)::int from "Tag") as tags,
          (select count(*)::int from "ArticleIdea") as ideas,
          (select count(*)::int from "Media") as media
      `,
      prisma.post.findMany({
        take: 6,
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, slug: true, status: true, type: true, updatedAt: true },
      }),
    ]);

    const counts = rows[0] || { total: 0, published: 0, drafts: 0, scheduled: 0, archived: 0, categories: 0, tags: 0, ideas: 0, media: 0 };
    return ok({ counts, recent });
  } catch (error) {
    console.error("Admin stats error", error);
    return fail("تعذر تحميل الإحصائيات الآن", 503);
  }
}
