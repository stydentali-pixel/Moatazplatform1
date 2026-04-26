import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: "asc" },
      take: 100,
      select: { id: true, name: true, slug: true, _count: { select: { posts: true } } },
    });
    return ok(tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug, count: t._count.posts })));
  } catch (error) {
    console.error("Public tags error", error);
    return fail("تعذر تحميل الوسوم", 503);
  }
}
