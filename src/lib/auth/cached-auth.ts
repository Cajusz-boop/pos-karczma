import bcrypt from "bcryptjs";
import { db } from "@/lib/db/offline-db";
import type { CachedSession } from "@/lib/db/offline-db";

const SESSION_DAYS = 7;

export type CachedUser = {
  id: string;
  name: string;
  roleId: string;
  roleName: string;
  isOwner: boolean;
};

/** Zapisuje sesję po udanym logowaniu online. PIN hashowany bcrypt przed zapisem. */
export async function cacheSession(
  user: { id: string; name: string; roleId: string; roleName: string; isOwner: boolean },
  pin: string
): Promise<void> {
  if (typeof window === "undefined") return;
  const pinHash = await bcrypt.hash(pin, 10);
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  await db.cachedSessions.put({
    userId: user.id,
    userName: user.name,
    userRole: user.roleName,
    isOwner: user.isOwner,
    pinHash,
    cachedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });
}

/** Zwraca użytkowników z ważną (nie-expired) cached session. */
export async function getCachedUsers(): Promise<CachedUser[]> {
  if (typeof window === "undefined") return [];
  const now = new Date().toISOString();
  const sessions = await db.cachedSessions.toArray();
  const valid = sessions.filter((s) => s.expiresAt > now);
  return valid.map((s) => ({
    id: s.userId,
    name: s.userName,
    roleId: "",
    roleName: s.userRole,
    isOwner: s.isOwner,
  }));
}

/** Zwraca cached session po userId lub null jeśli expired. */
export async function getCachedSession(userId: string): Promise<CachedSession | null> {
  if (typeof window === "undefined") return null;
  const session = await db.cachedSessions.get(userId);
  if (!session || session.expiresAt < new Date().toISOString()) return null;
  return session;
}

/** Weryfikuje PIN offline — bcrypt.compare. Zwraca false jeśli session expired. */
export async function verifyCachedPin(userId: string, pin: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const session = await getCachedSession(userId);
  if (!session) return false;
  return bcrypt.compare(pin, session.pinHash);
}

/** Usuwa sesje gdzie expiresAt < now. Wywoływać przy starcie DexieProvider. */
export async function clearExpiredSessions(): Promise<number> {
  if (typeof window === "undefined") return 0;
  const now = new Date().toISOString();
  const all = await db.cachedSessions.toArray();
  const toDelete = all.filter((s) => s.expiresAt < now);
  for (const s of toDelete) {
    await db.cachedSessions.delete(s.userId);
  }
  return toDelete.length;
}
