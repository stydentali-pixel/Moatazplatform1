import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

const ADMIN_PATH = "/admin";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  if (pathname.startsWith(ADMIN_PATH)) {
    const token = req.cookies.get("moataz_token")?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
