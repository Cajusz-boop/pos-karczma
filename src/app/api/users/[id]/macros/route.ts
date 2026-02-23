import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const macroActionSchema = z.object({
  type: z.enum([
    "addProduct",
    "setQuantity",
    "setModifier",
    "setNote",
    "goToCategory",
    "openPayment",
    "sendToKitchen",
    "printReceipt",
    "splitOrder",
    "setCourse",
    "fire",
    "delay",
  ]),
  productId: z.string().optional(),
  categoryId: z.string().optional(),
  modifierId: z.string().optional(),
  value: z.union([z.number(), z.string()]).optional(),
});

const createMacroSchema = z.object({
  slot: z.number().int().min(1).max(5),
  name: z.string().min(1).max(50),
  actionsJson: z.array(macroActionSchema).min(1),
  hotkey: z.string().max(10).nullable().optional(),
  isActive: z.boolean().default(true),
});

const updateMacroSchema = createMacroSchema.partial().extend({
  slot: z.number().int().min(1).max(5),
});

/**
 * GET /api/users/[id]/macros - get user macros
 */
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export async function generateStaticParams() {
  return [ {"id":"_"} ];
}


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    const macros = await prisma.userMacro.findMany({
      where: { userId },
      orderBy: { slot: "asc" },
    });

    return NextResponse.json({
      macros: macros.map((m) => ({
        id: m.id,
        slot: m.slot,
        name: m.name,
        actionsJson: m.actionsJson,
        hotkey: m.hotkey,
        isActive: m.isActive,
      })),
    });
  } catch (e) {
    console.error("[UserMacros GET]", e);
    return NextResponse.json({ error: "Błąd pobierania makr" }, { status: 500 });
  }
}

/**
 * POST /api/users/[id]/macros - create/update macro
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const parsed = createMacroSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { slot, name, actionsJson, hotkey, isActive } = parsed.data;

    const macro = await prisma.userMacro.upsert({
      where: { userId_slot: { userId, slot } },
      create: {
        userId,
        slot,
        name,
        actionsJson,
        hotkey,
        isActive,
      },
      update: {
        name,
        actionsJson,
        hotkey,
        isActive,
      },
    });

    const requestUserId = request.headers.get("x-user-id");
    await auditLog(requestUserId, "USER_MACRO_SAVED", "UserMacro", macro.id, undefined, {
      slot,
      name,
      actionCount: actionsJson.length,
    });

    return NextResponse.json({
      macro: {
        id: macro.id,
        slot: macro.slot,
        name: macro.name,
        hotkey: macro.hotkey,
        isActive: macro.isActive,
      },
      message: `Makro "${name}" zapisane w slocie ${slot}`,
    });
  } catch (e) {
    console.error("[UserMacros POST]", e);
    return NextResponse.json({ error: "Błąd zapisywania makra" }, { status: 500 });
  }
}

/**
 * PATCH /api/users/[id]/macros - update macro
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const parsed = updateMacroSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { slot, ...updateData } = parsed.data;

    const macro = await prisma.userMacro.update({
      where: { userId_slot: { userId, slot } },
      data: updateData,
    });

    const requestUserId = request.headers.get("x-user-id");
    await auditLog(requestUserId, "USER_MACRO_UPDATED", "UserMacro", macro.id, undefined, updateData);

    return NextResponse.json({ macro });
  } catch (e) {
    console.error("[UserMacros PATCH]", e);
    return NextResponse.json({ error: "Błąd aktualizacji makra" }, { status: 500 });
  }
}

/**
 * DELETE /api/users/[id]/macros - delete macro
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const slot = parseInt(searchParams.get("slot") ?? "0");

    if (!slot || slot < 1 || slot > 5) {
      return NextResponse.json({ error: "Nieprawidłowy slot (1-5)" }, { status: 400 });
    }

    await prisma.userMacro.delete({
      where: { userId_slot: { userId, slot } },
    });

    const requestUserId = request.headers.get("x-user-id");
    await auditLog(requestUserId, "USER_MACRO_DELETED", "UserMacro", `${userId}:${slot}`);

    return NextResponse.json({ message: `Makro ze slotu ${slot} usunięte` });
  } catch (e) {
    console.error("[UserMacros DELETE]", e);
    return NextResponse.json({ error: "Błąd usuwania makra" }, { status: 500 });
  }
}
