import { jwtVerify } from "jose/jwt/verify";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

const isPublicPath = (pathname: string) =>
  pathname === "/login" ||
  pathname.startsWith("/login/") ||
  pathname === "/api/auth" ||
  pathname.startsWith("/api/auth/") ||
  pathname === "/api/health" ||
  pathname === "/services" ||
  pathname.startsWith("/services/") ||
  pathname === "/api/cron" ||
  pathname.startsWith("/api/cron/");

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname.replace(/\/+$/, "") || "/";

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session")?.value;
  if (token) {
    try {
      await jwtVerify(
        token,
        new TextEncoder().encode(env.JWT_SECRET),
        { algorithms: ["HS256"] },
      );
      return NextResponse.next();
    } catch {
      // Treat missing configuration and invalid tokens as unauthenticated.
    }
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
