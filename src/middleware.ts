import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

const PUBLIC_PREFIXES = [
  "/login",
  "/api/auth/facebook",
  "/api/auth/instagram",
  "/api/auth/demo",
  "/api/auth/me",
  "/api/auth/logout",
  "/api/config",
  "/api/scheduler/tick",
];

function isPublic(pathname: string): boolean {
  if (pathname === "/") return false;
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = req.cookies.get(SESSION_COOKIE)?.value;
  const publicPath = isPublic(pathname);

  if (!session && !publicPath) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Sign in to continue." },
        { status: 401 }
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (session && pathname === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|uploads/).*)"],
};
