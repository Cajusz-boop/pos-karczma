import { NextRequest, NextResponse } from "next/server";

// Capacitor static builds don't use middleware (API runs on remote server)
const isCapacitorBuild = process.env.CAPACITOR_BUILD === "1";

export async function middleware(request: NextRequest) {
  // No-op for Capacitor builds
  if (isCapacitorBuild) {
    return NextResponse.next();
  }

  // Dynamic imports to avoid loading dependencies in static builds
  const { verifySession, COOKIE_NAME } = await import("@/lib/jwt");
  const { checkRateLimit, getConfigForRoute } = await import("@/lib/rate-limit");

  const PUBLIC_API_ROUTES = [
    "/api/auth/login",
    "/api/auth/token-login",
    "/api/auth/users",
    "/api/users",
    "/api/health",
    "/api/ping",
  ];

  const PUBLIC_API_PREFIXES = [
    "/api/e-receipt/",
    "/api/tools/",
    "/api/public/",
    "/api/webhooks/",
  ];

  function isPublicApiRoute(pathname: string): boolean {
    if (PUBLIC_API_ROUTES.includes(pathname)) return true;
    return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  }

  const { pathname } = request.nextUrl;

  /** Receptury: odczyt bez logowania (dla linku szefa kuchni). */
  const isRecepturyRead =
    request.method === "GET" &&
    (pathname === "/api/receptury" ||
      pathname.startsWith("/api/receptury/") ||
      pathname === "/api/tagi");

  function getClientIp(req: NextRequest): string {
    return (
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      req.headers.get("cf-connecting-ip") ??
      "unknown"
    );
  }

  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const clientIp = getClientIp(request);
  const rateLimitKey = `${clientIp}:${pathname.split("/").slice(0, 4).join("/")}`;
  const rlConfig = getConfigForRoute(pathname);
  const rl = checkRateLimit(rateLimitKey, rlConfig);

  if (!rl.allowed) {
    return NextResponse.json(
      { 
        error: "Zbyt wiele żądań. Spróbuj ponownie za chwilę.",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: Math.ceil((rl.resetAt - Date.now()) / 1000),
      },
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

  if (isPublicApiRoute(pathname) || isRecepturyRead) {
    const res = NextResponse.next();
    res.headers.set("X-RateLimit-Remaining", String(rl.remaining));
    return res;
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json(
      { error: "Brak autoryzacji", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const session = await verifySession(token);
  if (!session) {
    const res = NextResponse.json(
      { error: "Sesja wygasła — zaloguj się ponownie", code: "SESSION_EXPIRED" },
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
