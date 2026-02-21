import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, updateUserSchema } from "@/lib/validation";
import { hashPin } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { autoExportConfigSnapshot } from "@/lib/config-snapshot";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: { select: { id: true, name: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: "Użytkownik nie istnieje" }, { status: 404 });
    }

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
    return NextResponse.json({ error: "Błąd pobierania użytkownika" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const existing = await prisma.user.findUnique({
      where: { id },
      include: { role: { select: { name: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Użytkownik nie istnieje" }, { status: 404 });
    }

    const { data, error: valError } = await parseBody(request, updateUserSchema);
    if (valError) return valError;

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.roleId !== undefined) {
      const role = await prisma.role.findUnique({ where: { id: data.roleId } });
      if (!role) return NextResponse.json({ error: "Rola nie istnieje" }, { status: 404 });
      updateData.roleId = data.roleId;
    }
    if (data.pin !== undefined) {
      updateData.pin = await hashPin(data.pin);
    }
    if (data.isOwner !== undefined) updateData.isOwner = data.isOwner;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.authMethod !== undefined) updateData.authMethod = data.authMethod;
    if (data.tokenId !== undefined) updateData.tokenId = data.tokenId || null;
    if (data.tokenType !== undefined) updateData.tokenType = data.tokenType || null;
    if (data.expiresAt !== undefined) {
      updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: { select: { id: true, name: true } } },
    });

    const requestUserId = request.headers.get("x-user-id");
    const changes: Record<string, unknown> = { ...updateData };
    if (changes.pin) changes.pin = "[CHANGED]";
    await auditLog(requestUserId, "USER_UPDATE", "User", id, {
      name: existing.name,
      roleName: existing.role.name,
      isOwner: existing.isOwner,
      isActive: existing.isActive,
    }, changes);

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
    return NextResponse.json({ error: "Błąd aktualizacji użytkownika" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Użytkownik nie istnieje" }, { status: 404 });
    }

    // Soft delete
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    const requestUserId = request.headers.get("x-user-id");
    await auditLog(requestUserId, "USER_DELETE", "User", id, {
      name: existing.name,
    });

    autoExportConfigSnapshot();
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd dezaktywacji użytkownika" }, { status: 500 });
  }
}
