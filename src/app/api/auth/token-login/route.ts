import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { signSession, COOKIE_NAME } from "@/lib/jwt";
import { parseBody, tokenLoginSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const { data, error: valError } = await parseBody(request, tokenLoginSchema);
    if (valError) return valError;

    const { tokenId } = data;

    const user = await prisma.user.findUnique({
      where: { tokenId },
      include: { role: { select: { name: true } } },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Nieznany token — brak przypisanego użytkownika" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Konto użytkownika jest nieaktywne" },
        { status: 401 }
      );
    }

    if (user.expiresAt && user.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Konto użytkownika wygasło" },
        { status: 401 }
      );
    }

    const token = await signSession({
      userId: user.id,
      roleName: user.role.name,
      isOwner: user.isOwner,
    });

    await auditLog(
      user.id,
      "TOKEN_LOGIN",
      "User",
      user.id,
      undefined,
      undefined,
      { tokenType: user.tokenType, method: "token" }
    );

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
      { error: "Błąd logowania tokenem" },
      { status: 500 }
    );
  }
}
