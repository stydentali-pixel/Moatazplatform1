import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { uploadFile } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export async function GET() {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);
  try {
    const items = await prisma.media.findMany({ orderBy: { createdAt: "desc" }, take: 80 });
    return ok(items);
  } catch (error) {
    console.error("Media list error", error);
    return fail("تعذر تحميل الوسائط", 503);
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);

  try {
    const form = await req.formData().catch(() => null);
    if (!form) return fail("بيانات غير صحيحة", 400);

    const file = form.get("file") as File | null;
    const altText = (form.get("altText") as string) || null;
    if (!file) return fail("لم يتم اختيار ملف", 400);
    if (file.size > MAX_UPLOAD_BYTES) return fail("حجم الملف كبير. الحد الأقصى 5MB.", 400);

    const buf = Buffer.from(await file.arrayBuffer());
    const upload = await uploadFile(buf, file.name, file.type || "application/octet-stream");

    const media = await prisma.media.create({
      data: {
        url: upload.url,
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        size: buf.length,
        altText,
      },
    });

    return ok({ ...media, storage: upload.storage });
  } catch (error) {
    console.error("Media upload error", error);
    return fail("تعذر رفع الملف الآن", 503);
  }
}
