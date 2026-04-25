import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/api";

export async function GET() {
  const cats = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: { where: { status: "PUBLISHED" } } } } },
  });
  return ok(cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description, count: c._count.posts })));
}
