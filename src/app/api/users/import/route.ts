import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";
import bcrypt from "bcryptjs";

const importSchema = z.object({
  exportVersion: z.string(),
  user: z.object({
    name: z.string(),
    roleName: z.string(),
    authMethod: z.enum(["PIN", "NFC", "BARCODE", "CARD"]).optional(),
    tokenType: z.enum(["NFC", "BARCODE", "CARD"]).nullable().optional(),
    isActive: z.boolean().optional(),
    autoLogoutSec: z.number().int().nullable().optional(),
    allowedCategoryIds: z.any().nullable().optional(),
    allowedTableIds: z.any().nullable().optional(),
    allowedPriceLevelIds: z.any().nullable().optional(),
    uiButtonGroups: z.any().nullable().optional(),
    permissionsJson: z.any().nullable().optional(),
  }),
});

/**
 * POST /api/users/import - import user from JSON
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = importSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowy format pliku" },
        { status: 400 }
      );
    }

    const { user: userData } = parsed.data;

    const role = await prisma.role.findFirst({
      where: { name: userData.roleName },
    });

    if (!role) {
      return NextResponse.json(
        { error: `Rola "${userData.roleName}" nie istnieje. Utwórz ją najpierw.` },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: { name: userData.name },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: `Użytkownik "${userData.name}" już istnieje` },
        { status: 400 }
      );
    }

    const tempPin = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedPin = await bcrypt.hash(tempPin, 10);

    const user = await prisma.user.create({
      data: {
        name: userData.name,
        pin: hashedPin,
        roleId: role.id,
        authMethod: userData.authMethod ?? "PIN",
        tokenType: userData.tokenType,
        isActive: userData.isActive ?? true,
        autoLogoutSec: userData.autoLogoutSec,
        allowedCategoryIds: userData.allowedCategoryIds,
        allowedTableIds: userData.allowedTableIds,
        allowedPriceLevelIds: userData.allowedPriceLevelIds,
        uiButtonGroups: userData.uiButtonGroups,
        permissionsJson: userData.permissionsJson,
      },
      select: {
        id: true,
        name: true,
        role: { select: { name: true } },
      },
    });

    const requestUserId = request.headers.get("x-user-id");
    await auditLog(requestUserId, "USER_IMPORTED", "User", user.id, undefined, {
      name: user.name,
      roleName: user.role.name,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        roleName: user.role.name,
      },
      tempPin,
      message: `Użytkownik "${user.name}" zaimportowany. Tymczasowy PIN: ${tempPin}`,
    }, { status: 201 });
  } catch (e) {
    console.error("[UserImport POST]", e);
    return NextResponse.json({ error: "Błąd importu użytkownika" }, { status: 500 });
  }
}
