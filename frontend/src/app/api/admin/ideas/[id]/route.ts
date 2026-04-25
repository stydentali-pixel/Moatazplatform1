import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, readJson } from "@/lib/api";

const Schema = z.object({
  status: z.enum(["SUGGESTED", "DRAFTED", "APPROVED", "REJECTED", "SCHEDULED", "PUBLISHED"]).optional(),
  title: z.string().optional(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);
  const body = await readJson(req);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return fail("بيانات غير صحيحة", 400);
  const idea = await prisma.articleIdea.update({ where: { id: params.id }, data: parsed.data });
  return ok(idea);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);
  await prisma.articleIdea.delete({ where: { id: params.id } }).catch(() => null);
  return ok({ deleted: true });
}
