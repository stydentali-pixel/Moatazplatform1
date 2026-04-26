import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, readJson } from "@/lib/api";
import { readingTimeMinutes, uniquePostSlug } from "@/lib/slug";
import { generateExcerpt, safeImageUrl } from "@/lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const PatchSchema = z.object({
  title: z.string().optional(),
  slug: z.string().optional().nullable(),
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

  try {
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        tags: { include: { tag: true } },
        category: true,
        author: { select: { id: true, name: true, avatar: true } },
      },
    });
    if (!post) return fail("غير موجود", 404);
    return ok({ ...post, tags: post.tags.map((pt) => pt.tag) });
  } catch (error) {
    console.error("Admin post read error", error);
    return fail("تعذر تحميل المقال الآن", 503);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);

  try {
    const body = await readJson(req);
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0]?.message || "بيانات غير صحيحة", 400);
    const d = parsed.data;

    const current = await prisma.post.findUnique({ where: { id: params.id } });
    if (!current) return fail("غير موجود", 404);

    const update: any = {};
    if (d.title !== undefined) update.title = d.title;
    
    // Handle slug uniqueness
    if (d.slug !== undefined && d.slug?.trim()) {
      const newSlug = d.slug.trim();
      if (newSlug !== current.slug) {
        const existing = await prisma.post.findUnique({ where: { slug: newSlug } });
        if (existing) return fail("الرابط (slug) مستخدم بالفعل، يرجى اختيار رابط آخر", 400);
        update.slug = newSlug;
      }
    } else if (d.title && d.title !== current.title) {
      update.slug = await uniquePostSlug(d.title, current.id);
    }

    if (d.excerpt !== undefined) update.excerpt = d.excerpt?.trim() || generateExcerpt(d.content ?? current.content, d.title ?? current.title);
    if (d.content !== undefined) {
      update.content = d.content;
      update.readingTime = readingTimeMinutes(d.content);
    }
    if (d.coverImage !== undefined) update.coverImage = safeImageUrl(d.coverImage) || null;
    if (d.type !== undefined) update.type = d.type;
    if (d.featured !== undefined) update.featured = d.featured;
    if (d.categoryId !== undefined) update.categoryId = d.categoryId;
    if (d.seoTitle !== undefined) update.seoTitle = d.seoTitle;
    if (d.seoDescription !== undefined) update.seoDescription = d.seoDescription;
    if (d.canonicalUrl !== undefined) update.canonicalUrl = d.canonicalUrl;
    if (d.scheduledAt !== undefined) update.scheduledAt = d.scheduledAt ? new Date(d.scheduledAt) : null;
    
    if (d.excerpt === undefined && (d.content !== undefined || d.title !== undefined) && !current.excerpt) {
      update.excerpt = generateExcerpt(d.content ?? current.content, d.title ?? current.title);
    }

    if (d.status !== undefined) {
      update.status = d.status;
      if (d.status === "PUBLISHED") {
        if (!(d.categoryId ?? current.categoryId)) return fail("اختر التصنيف قبل النشر", 400);
        if (!current.publishedAt) update.publishedAt = new Date();
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const post = await tx.post.update({ where: { id: params.id }, data: update });
      if (d.tagIds) {
        await tx.postTag.deleteMany({ where: { postId: params.id } });
        if (d.tagIds.length) {
          await tx.postTag.createMany({
            data: d.tagIds.map((tagId) => ({ postId: params.id, tagId })),
            skipDuplicates: true,
          });
        }
      }
      return post;
    });

    return ok(updated);
  } catch (error: any) {
    console.error("Admin post update error", error);
    if (error?.code === "P2002") return fail("الرابط مستخدم بالفعل", 400);
    return fail("تعذر حفظ التعديلات الآن", 503);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);

  try {
    await prisma.$transaction([
      prisma.postTag.deleteMany({ where: { postId: params.id } }),
      prisma.post.delete({ where: { id: params.id } }),
    ]);
    return ok({ deleted: true });
  } catch (error) {
    console.error("Admin post delete error", error);
    return fail("تعذر حذف المقال الآن", 503);
  }
}
