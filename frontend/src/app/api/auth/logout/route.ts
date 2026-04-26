import { clearAuthCookie } from "@/lib/auth";
import { ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST() {
  clearAuthCookie();
  return ok({ loggedOut: true });
}
