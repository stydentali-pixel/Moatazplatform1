import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, readJson } from "@/lib/api";

const CreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
});

export async function GET() {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);
  const ideas = await prisma.articleIdea.findMany({ orderBy: { createdAt: "desc" } });
  return ok(ideas);
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);
  const body = await readJson(req);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return fail("العنوان مطلوب", 400);
  const idea = await prisma.articleIdea.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      notes: parsed.data.notes || null,
      source: parsed.data.source || "manual",
      authorId: user.id,
    },
  });
  return ok(idea);
}
