import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, readJson } from "@/lib/api";
import { uniquePostSlug, readingTimeMinutes } from "@/lib/slug";

const PostSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  slug: z.string().optional(),
  excerpt: z.string().optional().nullable(),
  content: z.string().optional().default(""),
  coverImage: z.string().optional().nullable(),
  type: z.enum(["ARTICLE", "STORY", "LINK", "IMAGE", "VIDEO", "QUOTE"]).default("ARTICLE"),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]).default("DRAFT"),
  featured: z.boolean().default(false),
  categoryId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional().default([]),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  canonicalUrl: z.string().optional().nullable(),
  scheduledAt: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const q = searchParams.get("q") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "20", 10));

  const where: any = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (q) where.title = { contains: q, mode: "insensitive" };

  const [items, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: { select: { name: true } },
        category: { select: { name: true, slug: true } },
        tags: { include: { tag: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return ok({
    items: items.map((p) => ({ ...p, tags: p.tags.map((pt) => pt.tag) })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);

  const body = await readJson(req);
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.errors[0]?.message || "بيانات غير صحيحة", 400);
  const d = parsed.data;

  const slug = d.slug?.trim() || (await uniquePostSlug(d.title));
  const existing = await prisma.post.findUnique({ where: { slug } });
  if (existing) return fail("الرابط مستخدم بالفعل", 400);

  const publishedAt = d.status === "PUBLISHED" ? new Date() : null;
  const scheduledAt = d.scheduledAt ? new Date(d.scheduledAt) : null;

  const post = await prisma.post.create({
    data: {
      title: d.title,
      slug,
      excerpt: d.excerpt || null,
      content: d.content || "",
      coverImage: d.coverImage || null,
      type: d.type,
      status: d.status,
      featured: d.featured,
      readingTime: readingTimeMinutes(d.content || ""),
      seoTitle: d.seoTitle || d.title,
      seoDescription: d.seoDescription || d.excerpt || null,
      canonicalUrl: d.canonicalUrl || null,
      publishedAt,
      scheduledAt,
      authorId: user.id,
      categoryId: d.categoryId || null,
      tags: { create: (d.tagIds || []).map((tagId) => ({ tagId })) },
    },
  });

  return ok(post);
}
