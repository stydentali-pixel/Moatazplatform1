import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { uploadFile } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);
  const items = await prisma.media.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return ok(items);
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);

  const form = await req.formData().catch(() => null);
  if (!form) return fail("بيانات غير صحيحة", 400);

  const file = form.get("file") as File | null;
  const altText = (form.get("altText") as string) || null;
  if (!file) return fail("لم يتم اختيار ملف", 400);

  const buf = Buffer.from(await file.arrayBuffer());
  const upload = await uploadFile(buf, file.name, file.type || "application/octet-stream");

  const media = await prisma.media.create({
    data: {
      url: upload.url,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      size: buf.length,
      altText: altText,
    },
  });

  return ok({ ...media, storage: upload.storage });
}
