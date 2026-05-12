import type { Prisma } from "@prisma/client";

/**
 * Small post projection for cards/lists. Never include `content` here; this keeps
 * Vercel ISR/server component payloads small and prevents FALLBACK_BODY_TOO_LARGE.
 */
export const postCardSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImage: true,
  guestAuthorName: true,
  guestAuthorAvatar: true,
  guestAuthorBio: true,
  type: true,
  status: true,
  publishedAt: true,
  readingTime: true,
  category: { select: { id: true, name: true, slug: true } },
  author: { select: { id: true, name: true, avatar: true } },
} satisfies Prisma.PostSelect;

export type PostCardRecord = Prisma.PostGetPayload<{ select: typeof postCardSelect }>;

export const DEFAULT_LOGO_URL = "/brand/logo.jpg";
export const DEFAULT_ICON_URL = "/brand/icon-192.jpg";
export const FALLBACK_COVER = "https://placehold.co/1200x675/f8f3e6/9a651c?text=Moataz+Platform";

export function safeImageUrl(value?: string | null): string | null {
  if (!value) return null;
  const url = String(value).trim();
  if (!url || url.startsWith("data:")) return null;
  if (url.length > 2000) return null;
  if (url.startsWith("/")) return url;
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return url;
  } catch {
    return null;
  }
}

export function htmlToText(input?: string | null): string {
  if (!input) return "";
  return String(input)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripHtml(input?: string | null, max = 180): string | null {
  const text = htmlToText(input);
  if (!text) return null;
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

export function generateExcerpt(content?: string | null, fallbackTitle?: string | null, min = 140, max = 180): string | null {
  const text = htmlToText(content);
  if (!text) return fallbackTitle ? stripHtml(fallbackTitle, max) : null;

  const sentences = text
    .split(/(?<=[.!؟،])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 40);

  const middle = Math.floor(sentences.length / 2);
  const candidates = [sentences[middle], sentences[middle - 1], sentences[middle + 1], ...sentences].filter(Boolean) as string[];
  const picked = candidates.find((s) => s.length >= min) || candidates[0] || text;
  return stripHtml(picked, max);
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
  const cleaned = html.replace(/<img[^>]+src=["']data:[^"']+["'][^>]*>/gi, "");
  return cleaned.length > maxChars ? `${cleaned.slice(0, maxChars)}<p>…</p>` : cleaned;
}

export function initials(name?: string | null): string {
  const clean = (name || "معتز").trim();
  return clean.slice(0, 1) || "م";
}


export function displayAuthor<T extends { guestAuthorName?: string | null; guestAuthorAvatar?: string | null; guestAuthorBio?: string | null; author?: { name?: string | null; avatar?: string | null; bio?: string | null } | null }>(post: T) {
  return {
    name: post.guestAuthorName?.trim() || post.author?.name || "معتز العلقمي",
    avatar: safeImageUrl(post.guestAuthorAvatar) || safeImageUrl(post.author?.avatar) || null,
    bio: post.guestAuthorBio?.trim() || post.author?.bio || null,
  };
}
