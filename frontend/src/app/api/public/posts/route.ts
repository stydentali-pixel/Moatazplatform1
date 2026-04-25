import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // ARTICLE, STORY, ...
  const category = searchParams.get("category"); // slug
  const tag = searchParams.get("tag"); // slug
  const featured = searchParams.get("featured"); // "true"
  const sort = searchParams.get("sort") || "latest"; // latest|popular
  const q = searchParams.get("q") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));

  const where: any = { status: "PUBLISHED" };
  if (type) where.type = type;
  if (featured === "true") where.featured = true;
  if (category) where.category = { slug: category };
  if (tag) where.tags = { some: { tag: { slug: tag } } };
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { excerpt: { contains: q, mode: "insensitive" } },
      { content: { contains: q, mode: "insensitive" } },
    ];
  }

  const orderBy =
    sort === "popular" ? [{ views: "desc" as const }, { publishedAt: "desc" as const }] : [{ publishedAt: "desc" as const }];

  const [items, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true } },
        tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return ok({
    items: items.map((p) => ({
      ...p,
      tags: p.tags.map((pt) => pt.tag),
    })),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}
