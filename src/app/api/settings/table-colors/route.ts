import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const DEFAULT_TABLE_COLORS = {
  FREE: "#22c55e",           // green - free
  FREE_UNAVAILABLE: "#9ca3af", // gray - free but unavailable
  OCCUPIED: "#ef4444",       // red - occupied
  OCCUPIED_ORDERED: "#f97316", // orange - occupied with orders sent
  OCCUPIED_READY: "#eab308",  // yellow - food ready
  RESERVED: "#3b82f6",       // blue - reserved
  RESERVED_SOON: "#8b5cf6",  // purple - reservation soon
  NEEDS_ATTENTION: "#ec4899", // pink - needs attention
};

const colorSchema = z.object({
  FREE: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  FREE_UNAVAILABLE: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  OCCUPIED: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  OCCUPIED_ORDERED: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  OCCUPIED_READY: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  RESERVED: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  RESERVED_SOON: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  NEEDS_ATTENTION: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
}).partial();

/**
 * GET /api/settings/table-colors - get table status colors
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: "tableColors" },
    });

    const colors = config?.value
      ? { ...DEFAULT_TABLE_COLORS, ...(config.value as object) }
      : DEFAULT_TABLE_COLORS;

    return NextResponse.json({
      colors,
      defaults: DEFAULT_TABLE_COLORS,
    });
  } catch (e) {
    console.error("[TableColors GET]", e);
    return NextResponse.json({ error: "Błąd pobierania kolorów" }, { status: 500 });
  }
}

/**
 * PUT /api/settings/table-colors - update table status colors
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = colorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe kolory" },
        { status: 400 }
      );
    }

    const existing = await prisma.systemConfig.findUnique({
      where: { key: "tableColors" },
    });

    const newColors = {
      ...(existing?.value as object ?? {}),
      ...parsed.data,
    };

    await prisma.systemConfig.upsert({
      where: { key: "tableColors" },
      update: { value: newColors },
      create: { key: "tableColors", value: newColors },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "TABLE_COLORS_UPDATED", "SystemConfig", "tableColors", undefined, parsed.data);

    return NextResponse.json({
      colors: { ...DEFAULT_TABLE_COLORS, ...newColors },
      message: "Kolory zapisane",
    });
  } catch (e) {
    console.error("[TableColors PUT]", e);
    return NextResponse.json({ error: "Błąd zapisywania kolorów" }, { status: 500 });
  }
}

/**
 * DELETE /api/settings/table-colors - reset to default colors
 */
export async function DELETE(request: NextRequest) {
  try {
    await prisma.systemConfig.deleteMany({
      where: { key: "tableColors" },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "TABLE_COLORS_RESET", "SystemConfig", "tableColors");

    return NextResponse.json({
      colors: DEFAULT_TABLE_COLORS,
      message: "Przywrócono domyślne kolory",
    });
  } catch (e) {
    console.error("[TableColors DELETE]", e);
    return NextResponse.json({ error: "Błąd resetowania" }, { status: 500 });
  }
}
