/**
 * Supabase Storage adapter with safe fallback.
 *
 * In production, set SUPABASE_SERVICE_ROLE_KEY and SUPABASE_STORAGE_BUCKET to
 * upload media to Supabase Storage.
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
  storage: "supabase";
  path: string;
}

export async function uploadFile(buffer: Buffer, filename: string, mimeType: string): Promise<UploadResult> {
  const sb = getSupabase();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "media";
  const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  if (!sb) {
    throw new Error("إعدادات Supabase غير مكتملة (SUPABASE_SERVICE_ROLE_KEY مفقود). لا يمكن رفع الملفات.");
  }

  // Ensure bucket exists and is public
  const { data: list } = await sb.storage.listBuckets();
  if (!list?.some((b) => b.name === bucket)) {
    const { error: createError } = await sb.storage.createBucket(bucket, { public: true });
    if (createError) throw new Error(`فشل إنشاء حاوية التخزين: ${createError.message}`);
  }

  const { error } = await sb.storage.from(bucket).upload(safeName, buffer, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) throw new Error(`فشل الرفع إلى Supabase: ${error.message}`);

  const { data } = sb.storage.from(bucket).getPublicUrl(safeName);
  if (!data?.publicUrl) throw new Error("تعذر الحصول على الرابط العام للملف المرفوع.");

  return { url: data.publicUrl, storage: "supabase", path: safeName };
}
