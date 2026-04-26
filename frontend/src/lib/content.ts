import type { Prisma } from "@prisma/client";

/**
 * A deliberately small post projection for cards/lists. Never include `content`
 * here; this keeps Vercel ISR/server component payloads small and avoids
 * FALLBACK_BODY_TOO_LARGE when old inline/base64 images exist in the database.
 */
export const postCardSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImage: true,
  type: true,
  status: true,
  publishedAt: true,
  readingTime: true,
  category: { select: { id: true, name: true, slug: true } },
  author: { select: { id: true, name: true } },
} satisfies Prisma.PostSelect;

export type PostCardRecord = Prisma.PostGetPayload<{ select: typeof postCardSelect }>;

export function safeImageUrl(value?: string | null): string | null {
  if (!value) return null;
  const url = String(value).trim();
  if (url.startsWith("data:")) return null;
  if (url.length > 2000) return null;
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return url;
  } catch {
    return null;
  }
}

export function stripHtml(input?: string | null, max = 180): string | null {
  if (!input) return null;
  const text = input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return null;
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

export function sanitizePostCard<T extends { coverImage?: string | null; excerpt?: string | null }>(post: T): T {
  return {
    ...post,
    coverImage: safeImageUrl(post.coverImage),
    excerpt: stripHtml(post.excerpt, 170),
  };
}

export function sanitizePostCards<T extends { coverImage?: string | null; excerpt?: string | null }>(posts: T[]): T[] {
  return posts.map((post) => sanitizePostCard(post));
}

export function truncateHtml(html: string, maxChars = 80000): string {
  if (!html) return "";
  return html.length > maxChars ? `${html.slice(0, maxChars)}<p>…</p>` : html;
}
