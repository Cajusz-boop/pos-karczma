import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

export const dynamic = 'force-dynamic';


/**
 * GET /api/auth/select-user - list users for manual selection (no password)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get("role");
    const activeOnly = searchParams.get("activeOnly") !== "false";

    const users = await prisma.user.findMany({
      where: {
        isActive: activeOnly ? true : undefined,
        ...(roleFilter && { role: { name: roleFilter } }),
      },
      select: {
        id: true,
        name: true,
        role: { select: { name: true } },
        isActive: true,
      },
      orderBy: [
        { role: { name: "asc" } },
        { name: "asc" },
      ],
    });

    const config = await prisma.systemConfig.findUnique({
      where: { key: "allowManualUserSelect" },
    });
    const allowManualSelect = (config?.value as boolean) ?? false;

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        role: u.role.name,
        isActive: u.isActive,
      })),
      allowManualSelect,
    });
  } catch (e) {
    console.error("[SelectUser GET]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d pobierania" }, { status: 500 });
  }
}

/**
 * POST /api/auth/select-user - login by manual selection (if allowed)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body as { userId: string };

    if (!userId) {
      return NextResponse.json({ error: "Brak ID uĹĽytkownika" }, { status: 400 });
    }

    const config = await prisma.systemConfig.findUnique({
      where: { key: "allowManualUserSelect" },
    });

    if (!(config?.value as boolean)) {
      return NextResponse.json(
        { error: "RÄ™czny wybĂłr uĹĽytkownika jest wyĹ‚Ä…czony" },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: { select: { name: true, permissions: true } },
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "UĹĽytkownik nieaktywny" }, { status: 404 });
    }

    if (user.expiresAt && user.expiresAt < new Date()) {
      return NextResponse.json({ error: "Konto wygasĹ‚o" }, { status: 401 });
    }

    await auditLog(user.id, "AUTH_MANUAL_SELECT", "User", user.id);

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
    console.error("[SelectUser POST]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d logowania" }, { status: 500 });
  }
}

/**
 * PUT /api/auth/select-user - toggle manual selection setting
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { allow } = body as { allow: boolean };

    await prisma.systemConfig.upsert({
      where: { key: "allowManualUserSelect" },
      update: { value: allow },
      create: { key: "allowManualUserSelect", value: allow },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "MANUAL_SELECT_TOGGLED", "SystemConfig", "allowManualUserSelect", undefined, { allow });

    return NextResponse.json({
      allowManualSelect: allow,
      message: allow ? "RÄ™czny wybĂłr wĹ‚Ä…czony" : "RÄ™czny wybĂłr wyĹ‚Ä…czony",
    });
  } catch (e) {
    console.error("[SelectUser PUT]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d ustawiania" }, { status: 500 });
  }
}
