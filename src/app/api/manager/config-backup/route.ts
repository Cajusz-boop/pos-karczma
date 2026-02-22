import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

/**
 * GET /api/manager/config-backup - list config backups or download one
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const backupId = searchParams.get("id");

    if (backupId) {
      const backup = await prisma.systemConfig.findUnique({
        where: { key: `backup_${backupId}` },
      });

      if (!backup) {
        return NextResponse.json({ error: "Kopia nie istnieje" }, { status: 404 });
      }

      return new NextResponse(JSON.stringify(backup.value, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="config_${backupId}.json"`,
        },
      });
    }

    const backups = await prisma.systemConfig.findMany({
      where: { key: { startsWith: "backup_" } },
      orderBy: { key: "desc" },
    });

    return NextResponse.json({
      backups: backups.map((b) => {
        const value = b.value as { name?: string; createdAt?: string; tables?: number };
        return {
          id: b.key.replace("backup_", ""),
          name: value.name ?? "Bez nazwy",
          createdAt: value.createdAt ?? null,
          tableCount: value.tables ?? 0,
        };
      }),
    });
  } catch (e) {
    console.error("[ConfigBackup GET]", e);
    return NextResponse.json({ error: "Błąd pobierania" }, { status: 500 });
  }
}

/**
 * POST /api/manager/config-backup - create config backup
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body as { name?: string };

    const [
      systemConfigs,
      printers,
      kdsStations,
      rooms,
      tables,
      categories,
    ] = await Promise.all([
      prisma.systemConfig.findMany({ where: { key: { not: { startsWith: "backup_" } } } }),
      prisma.printer.findMany(),
      prisma.kDSStation.findMany({ include: { categories: true } }),
      prisma.room.findMany(),
      prisma.table.findMany(),
      prisma.category.findMany(),
    ]);

    const backupId = Date.now().toString(36);
    const backupData = {
      name: name ?? `Kopia ${new Date().toLocaleDateString("pl-PL")}`,
      createdAt: new Date().toISOString(),
      version: "1.0",
      systemConfigs: systemConfigs.map((c) => ({ key: c.key, value: c.value })),
      printers: printers.length,
      kdsStations: kdsStations.length,
      rooms: rooms.length,
      tables: tables.length,
      categories: categories.length,
      data: {
        printers,
        kdsStations,
        rooms,
        tables,
        categories,
      },
    };

    await prisma.systemConfig.create({
      data: {
        key: `backup_${backupId}`,
        value: backupData,
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "CONFIG_BACKUP_CREATED", "SystemConfig", backupId, undefined, {
      name: backupData.name,
    });

    return NextResponse.json({
      backupId,
      name: backupData.name,
      message: "Kopia zapasowa utworzona",
    }, { status: 201 });
  } catch (e) {
    console.error("[ConfigBackup POST]", e);
    return NextResponse.json({ error: "Błąd tworzenia kopii" }, { status: 500 });
  }
}

/**
 * DELETE /api/manager/config-backup - delete config backup
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const backupId = searchParams.get("id");

    if (!backupId) {
      return NextResponse.json({ error: "Brak ID kopii" }, { status: 400 });
    }

    await prisma.systemConfig.delete({
      where: { key: `backup_${backupId}` },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "CONFIG_BACKUP_DELETED", "SystemConfig", backupId);

    return NextResponse.json({ message: "Kopia usunięta" });
  } catch (e) {
    console.error("[ConfigBackup DELETE]", e);
    return NextResponse.json({ error: "Błąd usuwania" }, { status: 500 });
  }
}
