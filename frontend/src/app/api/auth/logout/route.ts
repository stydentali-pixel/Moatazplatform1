import { clearAuthCookie } from "@/lib/auth";
import { ok } from "@/lib/api";

export async function POST() {
  clearAuthCookie();
  return ok({ loggedOut: true });
}
