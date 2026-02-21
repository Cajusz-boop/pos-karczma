import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const createDisplaySchema = z.object({
  name: z.string().min(1).max(100),
  isActive: z.boolean().default(true),
  showLogo: z.boolean().default(true),
  logoUrl: z.string().url().nullable().optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#1a1a2e"),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#ffffff"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#e94560"),
  fontSize: z.number().int().min(24).max(120).default(48),
  maxOrders: z.number().int().min(1).max(50).default(10),
  showPreparingSection: z.boolean().default(true),
  showReadySection: z.boolean().default(true),
  readyTimeoutSec: z.number().int().min(30).max(600).default(120),
  soundOnReady: z.boolean().default(true),
  soundUrl: z.string().url().nullable().optional(),
});

const updateDisplaySchema = createDisplaySchema.partial().extend({
  id: z.string().min(1),
});

/**
 * GET /api/customer-display - list all customer displays
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    const displays = await prisma.customerDisplay.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ displays });
  } catch (e) {
    console.error("[CustomerDisplay GET]", e);
    return NextResponse.json({ error: "Błąd pobierania ekranów" }, { status: 500 });
  }
}

/**
 * POST /api/customer-display - create customer display
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createDisplaySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const display = await prisma.customerDisplay.create({
      data: parsed.data,
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "CUSTOMER_DISPLAY_CREATED", "CustomerDisplay", display.id, undefined, {
      name: display.name,
    });

    return NextResponse.json({ display }, { status: 201 });
  } catch (e) {
    console.error("[CustomerDisplay POST]", e);
    return NextResponse.json({ error: "Błąd tworzenia ekranu" }, { status: 500 });
  }
}

/**
 * PATCH /api/customer-display - update customer display
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = updateDisplaySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { id, ...updateData } = parsed.data;

    const display = await prisma.customerDisplay.update({
      where: { id },
      data: updateData,
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "CUSTOMER_DISPLAY_UPDATED", "CustomerDisplay", id, undefined, updateData);

    return NextResponse.json({ display });
  } catch (e) {
    console.error("[CustomerDisplay PATCH]", e);
    return NextResponse.json({ error: "Błąd aktualizacji ekranu" }, { status: 500 });
  }
}

/**
 * DELETE /api/customer-display - delete customer display
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Brak ID ekranu" }, { status: 400 });
    }

    await prisma.customerDisplay.delete({
      where: { id },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "CUSTOMER_DISPLAY_DELETED", "CustomerDisplay", id);

    return NextResponse.json({ message: "Ekran usunięty" });
  } catch (e) {
    console.error("[CustomerDisplay DELETE]", e);
    return NextResponse.json({ error: "Błąd usuwania ekranu" }, { status: 500 });
  }
}
