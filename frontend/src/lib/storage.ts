/**
 * Supabase Storage adapter with safe fallback.
 *
 * In production, set SUPABASE_SERVICE_ROLE_KEY and SUPABASE_STORAGE_BUCKET to
 * upload media to Supabase Storage. If those are missing, this adapter returns
 * a tiny placeholder URL instead of storing base64 in the database. Base64 media
 * was one of the main causes of huge Vercel payloads and slow pages.
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    cached = null;
    return null;
  }
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

export interface UploadResult {
  url: string;
  storage: "supabase" | "inline";
  path?: string;
}

export async function uploadFile(buffer: Buffer, filename: string, mimeType: string): Promise<UploadResult> {
  const sb = getSupabase();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "media";
  const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  if (sb) {
    const { data: list } = await sb.storage.listBuckets();
    if (!list?.some((b) => b.name === bucket)) {
      await sb.storage.createBucket(bucket, { public: true });
    }
    const { error } = await sb.storage.from(bucket).upload(safeName, buffer, {
      contentType: mimeType,
      upsert: false,
    });
    if (error) throw new Error(`Supabase upload failed: ${error.message}`);
    const { data } = sb.storage.from(bucket).getPublicUrl(safeName);
    return { url: data.publicUrl, storage: "supabase", path: safeName };
  }

  return {
    url: "https://placehold.co/1200x675/f8f3e6/834f1a?text=Media",
    storage: "inline",
    path: safeName,
  };
}
