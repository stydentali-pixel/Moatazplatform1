import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  const [posts, cats, tags] = await Promise.all([
    prisma.post.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({ select: { slug: true } }),
    prisma.tag.findMany({ select: { slug: true } }),
  ]);
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/posts`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/categories`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/tags`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/about`, priority: 0.4 },
    { url: `${base}/contact`, priority: 0.4 },
    ...posts.map((p) => ({ url: `${base}/posts/${p.slug}`, lastModified: p.updatedAt, priority: 0.8 })),
    ...cats.map((c) => ({ url: `${base}/categories/${c.slug}`, priority: 0.6 })),
    ...tags.map((t) => ({ url: `${base}/tags/${t.slug}`, priority: 0.5 })),
  ];
}
