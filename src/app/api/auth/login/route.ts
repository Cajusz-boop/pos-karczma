export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { verifyPin } from "@/lib/auth";
import { signSession, COOKIE_NAME } from "@/lib/jwt";
import { parseBody, loginSchema } from "@/lib/validation";

const LOCKOUT_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 5;

const failedAttempts = new Map<
  string,
  { count: number; lockedUntil: Date }
>();

export async function POST(request: NextRequest) {
  try {
    const { data, error: valError } = await parseBody(request, loginSchema);
    if (valError) return valError;
    const { userId, pin } = data;

    const now = new Date();
    const lock = failedAttempts.get(userId);
    if (lock && now < lock.lockedUntil) {
      const remaining = Math.ceil((lock.lockedUntil.getTime() - now.getTime()) / 60000);
      return NextResponse.json(
        { error: `Konto zablokowane. Spróbuj za ${remaining} min.`, locked: true },
        { status: 423 }
      );
    }
    if (lock) failedAttempts.delete(userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: { select: { name: true } } },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Nieprawidłowy użytkownik" },
        { status: 401 }
      );
    }

    const valid = await verifyPin(String(pin), user.pin);
    if (!valid) {
      const prev = failedAttempts.get(userId);
      const count = (prev?.count ?? 0) + 1;
      if (count >= LOCKOUT_ATTEMPTS) {
        const lockedUntil = new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000);
        failedAttempts.set(userId, { count, lockedUntil });
        await auditLog(
          null,
          "PIN_LOCKOUT",
          "User",
          userId,
          undefined,
          undefined,
          { userName: user.name, attempts: count, lockedUntil: lockedUntil.toISOString() }
        );
        return NextResponse.json(
          {
            error: `Błędny PIN 3 razy. Konto zablokowane na ${LOCKOUT_MINUTES} min.`,
            locked: true,
          },
          { status: 423 }
        );
      }
      failedAttempts.set(userId, {
        count,
        lockedUntil: prev?.lockedUntil ?? now,
      });
      return NextResponse.json(
        { error: `Błędny PIN (${count}/${LOCKOUT_ATTEMPTS})` },
        { status: 401 }
      );
    }

    failedAttempts.delete(userId);

    const token = await signSession({
      userId: user.id,
      roleName: user.role.name,
      isOwner: user.isOwner,
    });

    const res = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        roleId: user.roleId,
        roleName: user.role.name,
        isOwner: user.isOwner,
      },
    });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Błąd logowania" },
      { status: 500 }
    );
  }
}
