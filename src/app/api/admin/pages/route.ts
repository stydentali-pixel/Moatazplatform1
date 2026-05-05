import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, readJson } from "@/lib/api";
import { arabicSlugify } from "@/lib/slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const Schema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  content: z.string().optional().default(""),
  published: z.boolean().optional().default(true),
});

export async function GET() {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);
  const items = await prisma.page.findMany({ orderBy: { updatedAt: "desc" } });
  return ok(items);
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);
  const body = await readJson(req);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return fail("بيانات غير صحيحة", 400);
  let slug = parsed.data.slug?.trim() || arabicSlugify(parsed.data.title);
  let i = 2;
  while (await prisma.page.findUnique({ where: { slug } })) {
    slug = `${arabicSlugify(parsed.data.title)}-${i++}`;
  }
  const page = await prisma.page.create({
    data: { title: parsed.data.title, slug, content: parsed.data.content, published: parsed.data.published },
  });
  return ok(page);
}
