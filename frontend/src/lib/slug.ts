import slugify from "slugify";
import { prisma } from "./prisma";

export function arabicSlugify(input: string): string {
  if (!input) return `post-${Date.now()}`;
  // slugify with Arabic support: convert spaces to dashes, remove problematic chars
  const base = slugify(input, { lower: true, strict: false, trim: true, locale: "ar" });
  // strict:false keeps Arabic letters; remove anything that's not letters/digits/dash
  const slug = base
    .replace(/[^\p{L}\p{N}-]/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
  
  return slug || `post-${Date.now()}`;
}

export async function uniquePostSlug(title: string, ignoreId?: string): Promise<string> {
  let base = arabicSlugify(title);
  let candidate = base;
  let i = 2;
  while (true) {
    const found = await prisma.post.findUnique({ where: { slug: candidate } });
    if (!found || found.id === ignoreId) return candidate;
    candidate = `${base}-${i++}`;
  }
}

export async function uniqueCategorySlug(name: string, ignoreId?: string): Promise<string> {
  let base = arabicSlugify(name);
  let candidate = base;
  let i = 2;
  while (true) {
    const found = await prisma.category.findUnique({ where: { slug: candidate } });
    if (!found || found.id === ignoreId) return candidate;
    candidate = `${base}-${i++}`;
  }
}

export async function uniqueTagSlug(name: string, ignoreId?: string): Promise<string> {
  let base = arabicSlugify(name);
  let candidate = base;
  let i = 2;
  while (true) {
    const found = await prisma.tag.findUnique({ where: { slug: candidate } });
    if (!found || found.id === ignoreId) return candidate;
    candidate = `${base}-${i++}`;
  }
}

export function readingTimeMinutes(content: string): number {
  // strip HTML, count words by whitespace
  const text = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").length : 0;
  return Math.max(1, Math.ceil(words / 200));
}
