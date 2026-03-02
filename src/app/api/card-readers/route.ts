export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";


const createReaderSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum([
    "NFC", "BARCODE", "CARD", "MAGNETIC_COM", "MAGNETIC_USB",
    "RFID_CLAMSHELL", "DALLAS_DATAPROCESS", "DALLAS_DEMIURG",
    "DALLAS_JARLTECH", "DALLAS_MP00202", "FILE_READER"
  ]),
  comPort: z.string().nullable().optional(),
  baudRate: z.number().int().optional(),
  dataBits: z.number().int().min(7).max(8).optional(),
  stopBits: z.number().int().min(1).max(2).optional(),
  parity: z.enum(["none", "odd", "even"]).optional(),
  filePath: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  workstationId: z.string().nullable().optional(),
});

const updateReaderSchema = createReaderSchema.partial().extend({
  id: z.string().min(1),
});

const READER_TYPE_DEFAULTS: Record<string, Partial<{
  baudRate: number;
  dataBits: number;
  stopBits: number;
  parity: string;
}>> = {
  MAGNETIC_COM: { baudRate: 9600, dataBits: 8, stopBits: 1, parity: "none" },
  RFID_CLAMSHELL: { baudRate: 19200, dataBits: 8, stopBits: 1, parity: "none" },
  DALLAS_DATAPROCESS: { baudRate: 9600, dataBits: 8, stopBits: 1, parity: "none" },
  DALLAS_DEMIURG: { baudRate: 9600, dataBits: 8, stopBits: 1, parity: "none" },
  DALLAS_JARLTECH: { baudRate: 9600, dataBits: 8, stopBits: 1, parity: "none" },
  DALLAS_MP00202: { baudRate: 9600, dataBits: 8, stopBits: 1, parity: "none" },
};

/**
 * GET /api/card-readers - list all card readers
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workstationId = searchParams.get("workstationId");
    const activeOnly = searchParams.get("activeOnly") === "true";

    const where: Record<string, unknown> = {};
    if (workstationId) where.workstationId = workstationId;
    if (activeOnly) where.isActive = true;

    const readers = await prisma.cardReaderConfig.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      readers,
      typeDefaults: READER_TYPE_DEFAULTS,
    });
  } catch (e) {
    console.error("[CardReaders GET]", e);
    return NextResponse.json({ error: "Błąd pobierania" }, { status: 500 });
  }
}

/**
 * POST /api/card-readers - create card reader config
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createReaderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const defaults = READER_TYPE_DEFAULTS[parsed.data.type] ?? {};
    const data = {
      ...defaults,
      ...parsed.data,
    };

    const reader = await prisma.cardReaderConfig.create({
      data,
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "CARD_READER_CREATED", "CardReaderConfig", reader.id, undefined, {
      name: reader.name,
      type: reader.type,
    });

    return NextResponse.json({ reader }, { status: 201 });
  } catch (e) {
    console.error("[CardReaders POST]", e);
    return NextResponse.json({ error: "Błąd tworzenia" }, { status: 500 });
  }
}

/**
 * PATCH /api/card-readers - update card reader config
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = updateReaderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { id, ...updateData } = parsed.data;

    const reader = await prisma.cardReaderConfig.update({
      where: { id },
      data: updateData,
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "CARD_READER_UPDATED", "CardReaderConfig", id, undefined, updateData);

    return NextResponse.json({ reader });
  } catch (e) {
    console.error("[CardReaders PATCH]", e);
    return NextResponse.json({ error: "Błąd aktualizacji" }, { status: 500 });
  }
}

/**
 * DELETE /api/card-readers - delete card reader config
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Brak ID czytnika" }, { status: 400 });
    }

    await prisma.cardReaderConfig.delete({
      where: { id },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "CARD_READER_DELETED", "CardReaderConfig", id);

    return NextResponse.json({ message: "Czytnik usunięty" });
  } catch (e) {
    console.error("[CardReaders DELETE]", e);
    return NextResponse.json({ error: "Błąd usuwania" }, { status: 500 });
  }
}
