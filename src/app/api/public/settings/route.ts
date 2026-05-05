import { ok, fail } from "@/lib/api";
import { getSiteSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    return ok(await getSiteSettings());
  } catch (error) {
    console.error("Public settings error", error);
    return fail("تعذر تحميل الإعدادات", 503);
  }
}
