import { prisma } from "./prisma";

let cache: { at: number; data: Record<string, string> } | null = null;
const TTL_MS = 30_000;

export async function getSiteSettings(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.data;
  try {
    const rows = await prisma.setting.findMany();
    const map: Record<string, string> = {};
    for (const s of rows) map[s.key] = s.value;
    cache = { at: now, data: map };
    return map;
  } catch {
    return cache?.data || {};
  }
}
