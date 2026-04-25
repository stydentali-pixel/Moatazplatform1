import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, readJson } from "@/lib/api";
import { uniqueCategorySlug } from "@/lib/slug";

const Schema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);
  const body = await readJson(req);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return fail("بيانات غير صحيحة", 400);
  const data: any = {};
  if (parsed.data.name) data.name = parsed.data.name;
  if (parsed.data.slug) data.slug = parsed.data.slug.trim();
  else if (parsed.data.name) data.slug = await uniqueCategorySlug(parsed.data.name, params.id);
  if (parsed.data.description !== undefined) data.description = parsed.data.description;
  const cat = await prisma.category.update({ where: { id: params.id }, data });
  return ok(cat);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);
  await prisma.post.updateMany({ where: { categoryId: params.id }, data: { categoryId: null } });
  await prisma.category.delete({ where: { id: params.id } }).catch(() => null);
  return ok({ deleted: true });
}
