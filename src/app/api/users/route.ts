import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, createUserSchema } from "@/lib/validation";
import { hashPin } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { autoExportConfigSnapshot } from "@/lib/config-snapshot";

export async function GET(request: NextRequest) {
  try {
    const showAll = request.nextUrl.searchParams.get("all") === "true";
    const users = await prisma.user.findMany({
      where: showAll ? {} : { isActive: true },
      include: {
        role: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        roleId: u.roleId,
        roleName: u.role.name,
        authMethod: u.authMethod,
        tokenId: u.tokenId,
        tokenType: u.tokenType,
        isOwner: u.isOwner,
        isActive: u.isActive,
        expiresAt: u.expiresAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Błąd pobierania użytkowników" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data, error: valError } = await parseBody(request, createUserSchema);
    if (valError) return valError;

    const role = await prisma.role.findUnique({ where: { id: data.roleId } });
    if (!role) {
      return NextResponse.json({ error: "Rola nie istnieje" }, { status: 404 });
    }

    const hashedPin = await hashPin(data.pin);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        pin: hashedPin,
        roleId: data.roleId,
        isOwner: data.isOwner ?? false,
        authMethod: data.authMethod ?? "PIN",
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
      include: {
        role: { select: { id: true, name: true } },
      },
    });

    const requestUserId = request.headers.get("x-user-id");
    await auditLog(requestUserId, "USER_CREATE", "User", user.id, undefined, {
      name: user.name,
      roleName: user.role.name,
      isOwner: user.isOwner,
    });

    autoExportConfigSnapshot();
    return NextResponse.json({
      id: user.id,
      name: user.name,
      roleId: user.roleId,
      roleName: user.role.name,
      authMethod: user.authMethod,
      tokenId: user.tokenId,
      tokenType: user.tokenType,
      isOwner: user.isOwner,
      isActive: user.isActive,
      expiresAt: user.expiresAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Błąd tworzenia użytkownika" },
      { status: 500 }
    );
  }
}
