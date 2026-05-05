import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

// Sitemap is generated at request time so the production build never fails
// when the database is unreachable. If the DB is down, we fall back to a
// minimal sitemap with just the static routes.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://example.com").replace(/\/$/, "");

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/posts`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/categories`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/tags`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/about`, priority: 0.4 },
    { url: `${base}/contact`, priority: 0.4 },
  ];

  try {
    const [posts, cats, tags] = await Promise.all([
      prisma.post.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
        take: 1000,
      }),
      prisma.category.findMany({ select: { slug: true }, take: 300 }),
      prisma.tag.findMany({ select: { slug: true }, take: 500 }),
    ]);

    return [
      ...staticRoutes,
      ...posts.map((p) => ({
        url: `${base}/posts/${p.slug}`,
        lastModified: p.updatedAt,
        priority: 0.8,
      })),
      ...cats.map((c) => ({ url: `${base}/categories/${c.slug}`, priority: 0.6 })),
      ...tags.map((t) => ({ url: `${base}/tags/${t.slug}`, priority: 0.5 })),
    ];
  } catch (err) {
    // DB unreachable during build (or temporarily) — return static-only sitemap
    // so the build/route never crashes.
    console.warn("[sitemap] database unavailable, returning static routes only:", err);
    return staticRoutes;
  }
}
