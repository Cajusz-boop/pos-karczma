import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE_NAME } from "@/lib/jwt";
import { checkRateLimit, getConfigForRoute } from "@/lib/rate-limit";

const PUBLIC_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/token-login",
  "/api/auth/users",
  "/api/users",
  "/api/health",
];

const PUBLIC_API_PREFIXES = [
  "/api/e-receipt/",
  "/api/tools/",
];

function isPublicApiRoute(pathname: string): boolean {
  if (PUBLIC_API_ROUTES.includes(pathname)) return true;
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Rate limiting
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
  const rateLimitKey = `${clientIp}:${pathname.split("/").slice(0, 4).join("/")}`;
  const rlConfig = getConfigForRoute(pathname);
  const rl = checkRateLimit(rateLimitKey, rlConfig);

  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Zbyt wiele żądań. Spróbuj ponownie za chwilę." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(rl.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
        },
      }
    );
  }

  if (isPublicApiRoute(pathname)) {
    const res = NextResponse.next();
    res.headers.set("X-RateLimit-Remaining", String(rl.remaining));
    return res;
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json(
      { error: "Brak autoryzacji" },
      { status: 401 }
    );
  }

  const session = await verifySession(token);
  if (!session) {
    const res = NextResponse.json(
      { error: "Sesja wygasła — zaloguj się ponownie" },
      { status: 401 }
    );
    res.cookies.delete(COOKIE_NAME);
    return res;
  }

  const headers = new Headers(request.headers);
  headers.set("x-user-id", session.userId);
  headers.set("x-user-role", session.roleName);
  headers.set("x-user-is-owner", String(session.isOwner));

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/api/:path*"],
};
