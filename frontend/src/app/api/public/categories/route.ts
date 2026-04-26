import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const cats = await prisma.category.findMany({
      orderBy: { name: "asc" },
      take: 100,
      select: { id: true, name: true, slug: true, description: true, _count: { select: { posts: { where: { status: "PUBLISHED" } } } } },
    });
    return ok(cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description, count: c._count.posts })));
  } catch (error) {
    console.error("Public categories error", error);
    return fail("تعذر تحميل التصنيفات", 503);
  }
}
