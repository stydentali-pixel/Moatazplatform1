import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, readJson } from "@/lib/api";
import { uniqueTagSlug } from "@/lib/slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const Schema = z.object({ name: z.string().optional(), slug: z.string().optional() });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);
  const body = await readJson(req);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return fail("بيانات غير صحيحة", 400);
  const data: any = {};
  if (parsed.data.name) data.name = parsed.data.name;
  if (parsed.data.slug) data.slug = parsed.data.slug.trim();
  else if (parsed.data.name) data.slug = await uniqueTagSlug(parsed.data.name, params.id);
  const tag = await prisma.tag.update({ where: { id: params.id }, data });
  return ok(tag);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);
  await prisma.postTag.deleteMany({ where: { tagId: params.id } });
  await prisma.tag.delete({ where: { id: params.id } }).catch(() => null);
  return ok({ deleted: true });
}
