import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, readJson } from "@/lib/api";
import { uniqueCategorySlug } from "@/lib/slug";

const Schema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
});

export async function GET() {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);
  const items = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });
  return ok(items.map((c) => ({ ...c, count: c._count.posts })));
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);
  const body = await readJson(req);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return fail("اسم التصنيف مطلوب", 400);
  const slug = parsed.data.slug?.trim() || (await uniqueCategorySlug(parsed.data.name));
  const cat = await prisma.category.create({
    data: { name: parsed.data.name, slug, description: parsed.data.description || null },
  });
  return ok(cat);
}
