import { getCurrentUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail("غير مسجل دخول", 401);
  return ok(user);
}
