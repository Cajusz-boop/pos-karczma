export const dynamic = 'force-dynamic';

﻿import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";


/**
 * GET /api/users/export?id=xxx - export user to JSON
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ error: "Brak ID uĹĽytkownika" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: { select: { name: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "UĹĽytkownik nie istnieje" }, { status: 404 });
    }

    const exportData = {
      exportVersion: "1.0",
      exportedAt: new Date().toISOString(),
      user: {
        name: user.name,
        roleName: user.role.name,
        authMethod: user.authMethod,
        tokenType: user.tokenType,
        isActive: user.isActive,
        autoLogoutSec: user.autoLogoutSec,
        allowedCategoryIds: user.allowedCategoryIds,
        allowedTableIds: user.allowedTableIds,
        allowedPriceLevelIds: user.allowedPriceLevelIds,
        uiButtonGroups: user.uiButtonGroups,
        permissionsJson: user.permissionsJson,
      },
    };

    const requestUserId = request.headers.get("x-user-id");
    await auditLog(requestUserId, "USER_EXPORTED", "User", userId);

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="user-${user.name.replace(/\s+/g, "_")}-${Date.now()}.json"`,
      },
    });
  } catch (e) {
    console.error("[UserExport GET]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d eksportu uĹĽytkownika" }, { status: 500 });
  }
}
