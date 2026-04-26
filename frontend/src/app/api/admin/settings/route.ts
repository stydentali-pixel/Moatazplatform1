import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, readJson } from "@/lib/api";
import { safeImageUrl } from "@/lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const Schema = z.object({ settings: z.record(z.string(), z.string()) });

export async function GET() {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);
  try {
    const [all, admin] = await Promise.all([
      prisma.setting.findMany(),
      prisma.user.findUnique({ where: { id: user.id }, select: { avatar: true } }),
    ]);
    const map: Record<string, string> = {};
    for (const s of all) map[s.key] = s.value;
    map.authorAvatar = admin?.avatar || map.authorAvatar || "";
    return ok(map);
  } catch (error) {
    console.error("Admin settings load error", error);
    return fail("تعذر تحميل الإعدادات", 503);
  }
}

export async function PUT(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);
  try {
    const body = await readJson(req);
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return fail("بيانات غير صحيحة", 400);

    const entries = Object.entries(parsed.data.settings);
    const siteSettings = entries.filter(([key]) => key !== "authorAvatar");
    const authorAvatar = parsed.data.settings.authorAvatar;

    await prisma.$transaction(async (tx) => {
      for (const [key, value] of siteSettings) {
        await tx.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
      }
      if (authorAvatar !== undefined) {
        await tx.user.update({ where: { id: user.id }, data: { avatar: safeImageUrl(authorAvatar) || null } });
      }
    });

    return ok({ saved: true });
  } catch (error) {
    console.error("Admin settings save error", error);
    return fail("تعذر حفظ الإعدادات", 503);
  }
}
