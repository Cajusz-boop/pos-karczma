export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";


/**
 * POST /api/auth/token - authenticate user via token (card, RFID, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenId, readerId } = body as { tokenId: string; readerId?: string };

    if (!tokenId) {
      return NextResponse.json({ error: "Brak tokenu" }, { status: 400 });
    }

    const normalizedToken = tokenId.trim().toUpperCase();

    const user = await prisma.user.findFirst({
      where: {
        tokenId: normalizedToken,
        isActive: true,
      },
      include: {
        role: { select: { name: true, permissions: true } },
      },
    });

    if (!user) {
      await auditLog(null, "AUTH_TOKEN_FAILED", "User", undefined, undefined, {
        tokenId: normalizedToken,
        readerId,
      });
      return NextResponse.json({ error: "Nieznany token" }, { status: 401 });
    }

    if (user.expiresAt && user.expiresAt < new Date()) {
      return NextResponse.json({ error: "Konto wygasło" }, { status: 401 });
    }

    await auditLog(user.id, "AUTH_TOKEN_SUCCESS", "User", user.id, undefined, {
      method: user.tokenType,
      readerId,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        role: user.role.name,
        permissions: user.role.permissions,
        autoLogoutSec: user.autoLogoutSec,
      },
      message: `Zalogowano: ${user.name}`,
    });
  } catch (e) {
    console.error("[AuthToken POST]", e);
    return NextResponse.json({ error: "Błąd autoryzacji" }, { status: 500 });
  }
}

/**
 * PUT /api/auth/token - assign token to user
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, tokenId, tokenType } = body as {
      userId: string;
      tokenId: string;
      tokenType: string;
    };

    if (!userId || !tokenId) {
      return NextResponse.json({ error: "Brak wymaganych pól" }, { status: 400 });
    }

    const normalizedToken = tokenId.trim().toUpperCase();

    const existingUser = await prisma.user.findFirst({
      where: {
        tokenId: normalizedToken,
        id: { not: userId },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: `Token już przypisany do: ${existingUser.name}` },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        tokenId: normalizedToken,
        tokenType: tokenType as "NFC" | "BARCODE" | "CARD" | "MAGNETIC_COM" | "MAGNETIC_USB" | "RFID_CLAMSHELL" | "DALLAS_DATAPROCESS" | "DALLAS_DEMIURG" | "DALLAS_JARLTECH" | "DALLAS_MP00202" | "FILE_READER",
      },
    });

    const requestUserId = request.headers.get("x-user-id");
    await auditLog(requestUserId, "USER_TOKEN_ASSIGNED", "User", userId, undefined, {
      tokenType,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        tokenId: user.tokenId,
        tokenType: user.tokenType,
      },
      message: "Token przypisany",
    });
  } catch (e) {
    console.error("[AuthToken PUT]", e);
    return NextResponse.json({ error: "Błąd przypisywania" }, { status: 500 });
  }
}

/**
 * DELETE /api/auth/token - remove token from user
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Brak ID użytkownika" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        tokenId: null,
        tokenType: null,
      },
    });

    const requestUserId = request.headers.get("x-user-id");
    await auditLog(requestUserId, "USER_TOKEN_REMOVED", "User", userId);

    return NextResponse.json({
      message: `Token usunięty dla: ${user.name}`,
    });
  } catch (e) {
    console.error("[AuthToken DELETE]", e);
    return NextResponse.json({ error: "Błąd usuwania" }, { status: 500 });
  }
}
