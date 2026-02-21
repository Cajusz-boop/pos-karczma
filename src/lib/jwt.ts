import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { headers } from "next/headers";

export interface SessionPayload extends JWTPayload {
  userId: string;
  roleName: string;
  isOwner: boolean;
}

const JWT_SECRET_RAW = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
const secret = new TextEncoder().encode(JWT_SECRET_RAW);

const SESSION_DURATION = "8h";
const COOKIE_NAME = "pos-session";

export { COOKIE_NAME };

export async function signSession(payload: Omit<SessionPayload, "iat" | "exp">): Promise<string> {
  return new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Read the authenticated user from request headers (set by middleware).
 * Call from API route handlers — returns null if not authenticated.
 */
export async function getSessionUser(): Promise<{ userId: string; roleName: string; isOwner: boolean } | null> {
  const h = await headers();
  const userId = h.get("x-user-id");
  if (!userId) return null;
  return {
    userId,
    roleName: h.get("x-user-role") ?? "",
    isOwner: h.get("x-user-is-owner") === "true",
  };
}
