/**
 * Supabase Storage adapter with safe fallback.
 *
 * If SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not configured,
 * the adapter falls back to in-database data URLs so uploads keep working
 * during development without crashing. Once credentials are added, it will
 * automatically switch to real Supabase Storage uploads.
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = process.env.SUPABASE_URL;
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

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<UploadResult> {
  const sb = getSupabase();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "media";
  const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  if (sb) {
    // ensure bucket exists (idempotent)
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

  // Fallback: data URL (dev/test only)
  const b64 = buffer.toString("base64");
  return { url: `data:${mimeType};base64,${b64}`, storage: "inline" };
}
