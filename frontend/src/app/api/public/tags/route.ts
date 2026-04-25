import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/api";

export async function GET() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });
  return ok(tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug, count: t._count.posts })));
}
