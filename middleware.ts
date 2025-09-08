import { NextRequest, NextResponse } from "next/server";

/**
 * Route → credentials mapping.
 * Set these in your environment (Vercel → Settings → Environment Variables):
 *
 *  DASH_USER / DASH_PASS       → /dashboard (client view)
 *  AUDITOR_USER / AUDITOR_PASS → /auditor   (auditor workspace)
 *  ADMIN_USER / ADMIN_PASS     → /admin, /leads, /providers (admin area)
 */
function needAuthFor(pathname: string) {
  if (pathname.startsWith("/dashboard")) {
    return { realm: 'Dashboard', user: process.env.DASH_USER, pass: process.env.DASH_PASS };
  }
  if (pathname.startsWith("/auditor")) {
    return { realm: 'Auditor', user: process.env.AUDITOR_USER, pass: process.env.AUDITOR_PASS };
  }
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/leads") ||
    pathname.startsWith("/providers")
  ) {
    return { realm: 'Admin', user: process.env.ADMIN_USER, pass: process.env.ADMIN_PASS };
  }
  return null;
}

export function middleware(req: NextRequest) {
  const rule = needAuthFor(req.nextUrl.pathname);
  if (!rule) return NextResponse.next();

  const realmHeader = `Basic realm="${rule.realm} Area"`;

  const auth = req.headers.get("authorization");
  if (!auth) {
    return new NextResponse("Auth required", { status: 401, headers: { "WWW-Authenticate": realmHeader } });
  }

  const [scheme, encoded] = auth.split(" ");
  if (scheme !== "Basic" || !encoded) {
    return new NextResponse("Invalid auth", { status: 401, headers: { "WWW-Authenticate": realmHeader } });
  }

  const [user, pass] = Buffer.from(encoded, "base64").toString().split(":");
  const ok = user === (rule.user || "") && pass === (rule.pass || "");
  if (!ok) {
    return new NextResponse("Forbidden", { status: 401, headers: { "WWW-Authenticate": realmHeader } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auditor/:path*",
    "/admin/:path*",
    "/leads/:path*",
    "/providers/:path*",
  ],
};