export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";


const configSchema = z.object({
  showTableNumber: z.boolean().optional(),
  showOrderNumber: z.boolean().optional(),
  showWaiterName: z.boolean().optional(),
  showDescription: z.boolean().optional(),
  autoScrollNew: z.boolean().optional(),
  confirmBeforeStatus: z.boolean().optional(),
  requireAllConfirm: z.boolean().optional(),
  removeOnConfirm: z.boolean().optional(),
  udpBroadcast: z.boolean().optional(),
  udpHost: z.string().nullable().optional(),
  udpPort: z.number().int().min(1).max(65535).nullable().optional(),
});

/**
 * GET /api/kds/stations/[id]/config - get station config
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const station = await prisma.kDSStation.findUnique({
      where: { id },
    });

    if (!station) {
      return NextResponse.json({ error: "Stacja nie istnieje" }, { status: 404 });
    }

    return NextResponse.json({
      station: {
        id: station.id,
        name: station.name,
        displayOrder: station.displayOrder,
        config: {
          showTableNumber: station.showTableNumber,
          showOrderNumber: station.showOrderNumber,
          showWaiterName: station.showWaiterName,
          showDescription: station.showDescription,
          autoScrollNew: station.autoScrollNew,
          confirmBeforeStatus: station.confirmBeforeStatus,
          requireAllConfirm: station.requireAllConfirm,
          removeOnConfirm: station.removeOnConfirm,
          udpBroadcast: station.udpBroadcast,
          udpHost: station.udpHost,
          udpPort: station.udpPort,
        },
      },
    });
  } catch (e) {
    console.error("[KDSStationConfig GET]", e);
    return NextResponse.json({ error: "Błąd pobierania konfiguracji" }, { status: 500 });
  }
}

/**
 * PUT /api/kds/stations/[id]/config - update station config
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = configSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const station = await prisma.kDSStation.update({
      where: { id },
      data: parsed.data,
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "KDS_STATION_CONFIG_UPDATED", "KDSStation", id, undefined, parsed.data);

    return NextResponse.json({
      station,
      message: "Konfiguracja zapisana",
    });
  } catch (e) {
    console.error("[KDSStationConfig PUT]", e);
    return NextResponse.json({ error: "Błąd zapisywania konfiguracji" }, { status: 500 });
  }
}
