import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { postCardSelect, sanitizePostCards } from "@/lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const featured = searchParams.get("featured");
    const sort = searchParams.get("sort") || "latest";
    const q = (searchParams.get("q") || "").trim().slice(0, 80);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(24, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));

    const where: any = { status: "PUBLISHED" };
    if (type) where.type = type;
    if (featured === "true") where.featured = true;
    if (category) where.category = { slug: category };
    if (tag) where.tags = { some: { tag: { slug: tag } } };
    if (q) where.OR = [{ title: { contains: q, mode: "insensitive" } }, { excerpt: { contains: q, mode: "insensitive" } }];

    const orderBy = sort === "popular" ? [{ views: "desc" as const }, { publishedAt: "desc" as const }] : [{ publishedAt: "desc" as const }, { createdAt: "desc" as const }];

    const [items, total] = await Promise.all([
      prisma.post.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit, select: postCardSelect }),
      prisma.post.count({ where }),
    ]);

    return ok({ items: sanitizePostCards(items), page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Public posts error", error);
    return fail("تعذر تحميل المنشورات الآن", 503);
  }
}
