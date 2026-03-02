export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const noteSchema = z.object({
  note: z.string().max(500).nullable(),
  noteType: z.enum(["STANDARD", "ALLERGY", "MODIFICATION", "RUSH"]).nullable(),
  isRush: z.boolean().optional(),
  isPriority: z.boolean().optional(),
  printBold: z.boolean().optional(),
});

/**
 * PUT /api/orders/[id]/items/[itemId]/note - update item note and flags
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: orderId, itemId } = await params;
    const body = await request.json();
    const parsed = noteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { note, noteType, isRush, isPriority, printBold } = parsed.data;

    const item = await prisma.orderItem.findUnique({
      where: { id: itemId, orderId },
      select: { id: true, sentToKitchenAt: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Pozycja nie istnieje" }, { status: 404 });
    }

    const updated = await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        note,
        noteType,
        isRush: isRush ?? undefined,
        isPriority: isPriority ?? undefined,
        printBold: printBold ?? undefined,
        isModifiedAfterSend: item.sentToKitchenAt ? true : undefined,
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "ORDER_ITEM_NOTE_UPDATED", "OrderItem", itemId, undefined, {
      note,
      noteType,
      isRush,
      isPriority,
    });

    return NextResponse.json({
      item: {
        id: updated.id,
        note: updated.note,
        noteType: updated.noteType,
        isRush: updated.isRush,
        isPriority: updated.isPriority,
        printBold: updated.printBold,
      },
    });
  } catch (e) {
    console.error("[ItemNote PUT]", e);
    return NextResponse.json({ error: "Błąd aktualizacji notatki" }, { status: 500 });
  }
}

/**
 * GET /api/orders/[id]/items/[itemId]/note - get item note
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: orderId, itemId } = await params;

    const item = await prisma.orderItem.findUnique({
      where: { id: itemId, orderId },
      select: {
        id: true,
        note: true,
        noteType: true,
        isRush: true,
        isPriority: true,
        printBold: true,
        isFire: true,
        isTakeaway: true,
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Pozycja nie istnieje" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (e) {
    console.error("[ItemNote GET]", e);
    return NextResponse.json({ error: "Błąd pobierania notatki" }, { status: 500 });
  }
}

/**
 * DELETE /api/orders/[id]/items/[itemId]/note - clear item note
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: orderId, itemId } = await params;

    const item = await prisma.orderItem.findUnique({
      where: { id: itemId, orderId },
      select: { id: true, sentToKitchenAt: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Pozycja nie istnieje" }, { status: 404 });
    }

    await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        note: null,
        noteType: null,
        isRush: false,
        isPriority: false,
        printBold: false,
        isModifiedAfterSend: item.sentToKitchenAt ? true : undefined,
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "ORDER_ITEM_NOTE_CLEARED", "OrderItem", itemId);

    return NextResponse.json({ message: "Notatka usunięta" });
  } catch (e) {
    console.error("[ItemNote DELETE]", e);
    return NextResponse.json({ error: "Błąd usuwania notatki" }, { status: 500 });
  }
}
