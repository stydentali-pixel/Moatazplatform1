import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, readJson } from "@/lib/api";
import { readingTimeMinutes, uniquePostSlug } from "@/lib/slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const PatchSchema = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  excerpt: z.string().optional().nullable(),
  content: z.string().optional(),
  coverImage: z.string().optional().nullable(),
  type: z.enum(["ARTICLE", "STORY", "LINK", "IMAGE", "VIDEO", "QUOTE"]).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]).optional(),
  featured: z.boolean().optional(),
  categoryId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  canonicalUrl: z.string().optional().nullable(),
  scheduledAt: z.string().optional().nullable(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: {
      tags: { include: { tag: true } },
      category: true,
      author: { select: { id: true, name: true } },
    },
  });
  if (!post) return fail("غير موجود", 404);
  return ok({ ...post, tags: post.tags.map((pt) => pt.tag) });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);

  const body = await readJson(req);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.errors[0]?.message || "بيانات غير صحيحة", 400);
  const d = parsed.data;

  const current = await prisma.post.findUnique({ where: { id: params.id } });
  if (!current) return fail("غير موجود", 404);

  const update: any = {};
  if (d.title !== undefined) update.title = d.title;
  if (d.slug !== undefined && d.slug.trim()) update.slug = d.slug.trim();
  else if (d.title && d.title !== current.title) update.slug = await uniquePostSlug(d.title, current.id);
  if (d.excerpt !== undefined) update.excerpt = d.excerpt;
  if (d.content !== undefined) {
    update.content = d.content;
    update.readingTime = readingTimeMinutes(d.content);
  }
  if (d.coverImage !== undefined) update.coverImage = d.coverImage;
  if (d.type !== undefined) update.type = d.type;
  if (d.featured !== undefined) update.featured = d.featured;
  if (d.categoryId !== undefined) update.categoryId = d.categoryId;
  if (d.seoTitle !== undefined) update.seoTitle = d.seoTitle;
  if (d.seoDescription !== undefined) update.seoDescription = d.seoDescription;
  if (d.canonicalUrl !== undefined) update.canonicalUrl = d.canonicalUrl;
  if (d.scheduledAt !== undefined) update.scheduledAt = d.scheduledAt ? new Date(d.scheduledAt) : null;
  if (d.status !== undefined) {
    update.status = d.status;
    if (d.status === "PUBLISHED" && !current.publishedAt) update.publishedAt = new Date();
  }

  const updated = await prisma.post.update({ where: { id: params.id }, data: update });

  if (d.tagIds) {
    await prisma.postTag.deleteMany({ where: { postId: params.id } });
    if (d.tagIds.length) {
      await prisma.postTag.createMany({
        data: d.tagIds.map((tagId) => ({ postId: params.id, tagId })),
        skipDuplicates: true,
      });
    }
  }

  return ok(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);
  await prisma.postTag.deleteMany({ where: { postId: params.id } });
  await prisma.post.delete({ where: { id: params.id } }).catch(() => null);
  return ok({ deleted: true });
}
