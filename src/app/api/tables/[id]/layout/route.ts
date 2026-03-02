export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const layoutSchema = z.object({
  positionX: z.number().min(0).optional(),
  positionY: z.number().min(0).optional(),
  width: z.number().min(20).max(500).optional(),
  height: z.number().min(20).max(500).optional(),
  rotation: z.number().refine((r) => [0, 90, 180, 270].includes(r)).optional(),
  zIndex: z.number().int().min(0).max(100).optional(),
  description: z.string().max(100).nullable().optional(),
  isAvailable: z.boolean().optional(),
  allowMultipleOrders: z.boolean().optional(),
  customColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
});

/**
 * GET /api/tables/[id]/layout - get table layout details
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const table = await prisma.table.findUnique({
      where: { id },
      include: { room: { select: { name: true } } },
    });

    if (!table) {
      return NextResponse.json({ error: "Stolik nie istnieje" }, { status: 404 });
    }

    return NextResponse.json({
      table: {
        id: table.id,
        number: table.number,
        roomName: table.room.name,
        layout: {
          positionX: table.positionX,
          positionY: table.positionY,
          width: table.width,
          height: table.height,
          rotation: table.rotation,
          zIndex: table.zIndex,
          shape: table.shape,
        },
        description: table.description,
        isAvailable: table.isAvailable,
        allowMultipleOrders: table.allowMultipleOrders,
        customColor: table.customColor,
      },
    });
  } catch (e) {
    console.error("[TableLayout GET]", e);
    return NextResponse.json({ error: "Błąd pobierania danych" }, { status: 500 });
  }
}

/**
 * PUT /api/tables/[id]/layout - update table layout
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = layoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const table = await prisma.table.update({
      where: { id },
      data: parsed.data,
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "TABLE_LAYOUT_UPDATED", "Table", id, undefined, parsed.data);

    return NextResponse.json({
      table,
      message: "Układ zapisany",
    });
  } catch (e) {
    console.error("[TableLayout PUT]", e);
    return NextResponse.json({ error: "Błąd zapisywania" }, { status: 500 });
  }
}

/**
 * POST /api/tables/[id]/layout - rotate table
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const direction = body.direction as "cw" | "ccw";

    const table = await prisma.table.findUnique({
      where: { id },
      select: { rotation: true },
    });

    if (!table) {
      return NextResponse.json({ error: "Stolik nie istnieje" }, { status: 404 });
    }

    let newRotation = table.rotation;
    if (direction === "cw") {
      newRotation = (newRotation + 90) % 360;
    } else {
      newRotation = (newRotation - 90 + 360) % 360;
    }

    const updated = await prisma.table.update({
      where: { id },
      data: { rotation: newRotation },
    });

    return NextResponse.json({
      table: updated,
      message: `Obrócono ${direction === "cw" ? "w prawo" : "w lewo"}`,
    });
  } catch (e) {
    console.error("[TableLayout POST]", e);
    return NextResponse.json({ error: "Błąd obracania" }, { status: 500 });
  }
}
