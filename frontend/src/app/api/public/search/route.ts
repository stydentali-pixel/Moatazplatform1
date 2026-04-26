import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { postCardSelect, sanitizePostCards } from "@/lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const q = (new URL(req.url).searchParams.get("q") || "").trim().slice(0, 80);
    if (!q) return ok({ items: [], q });
    const items = await prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { excerpt: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 20,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: postCardSelect,
    });
    return ok({ items: sanitizePostCards(items), q });
  } catch (error) {
    console.error("Public search error", error);
    return fail("تعذر البحث الآن", 503);
  }
}
