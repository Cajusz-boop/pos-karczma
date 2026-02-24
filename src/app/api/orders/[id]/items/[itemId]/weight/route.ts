export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const confirmWeightSchema = z.object({
  weight: z.number().min(0.001).max(100),
  barcode: z.string().optional(),
});

const barcodeWeightSchema = z.object({
  barcode: z.string().min(1),
});

/**
 * POST /api/orders/[id]/items/[itemId]/weight - confirm weight after preparation
 */
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export async function generateStaticParams() {
  return [ {"id":"_","itemId":"_"} ];
}


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: orderId, itemId } = await params;
    const body = await request.json();
    const parsed = confirmWeightSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { weight, barcode } = parsed.data;
    const userId = request.headers.get("x-user-id");

    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: {
        order: { select: { orderNumber: true } },
        product: { select: { name: true, priceGross: true } },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Pozycja nie istnieje" }, { status: 404 });
    }

    if (item.orderId !== orderId) {
      return NextResponse.json({ error: "Pozycja nie należy do tego zamówienia" }, { status: 400 });
    }

    if (!item.requiresWeightConfirm) {
      return NextResponse.json({ error: "Ta pozycja nie wymaga potwierdzenia wagi" }, { status: 400 });
    }

    if (item.weightConfirmed) {
      return NextResponse.json({ error: "Waga już została potwierdzona" }, { status: 400 });
    }

    const newUnitPrice = Number(item.product.priceGross) * weight;

    const updated = await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        weightConfirmed: true,
        confirmedWeight: weight,
        weightConfirmedAt: new Date(),
        weightConfirmedBy: userId,
        weightBarcodeScanned: barcode ?? null,
        quantity: weight,
        unitPrice: Number(item.product.priceGross),
      },
    });

    await auditLog(userId, "ORDER_ITEM_WEIGHT_CONFIRMED", "OrderItem", itemId, undefined, {
      orderId,
      orderNumber: item.order.orderNumber,
      productName: item.product.name,
      weight,
      barcode,
      newTotal: newUnitPrice,
    });

    return NextResponse.json({
      item: {
        id: updated.id,
        weightConfirmed: updated.weightConfirmed,
        confirmedWeight: Number(updated.confirmedWeight),
        quantity: Number(updated.quantity),
        unitPrice: Number(updated.unitPrice),
        total: Number(updated.quantity) * Number(updated.unitPrice),
      },
    });
  } catch (e) {
    console.error("[Weight POST]", e);
    return NextResponse.json({ error: "Błąd potwierdzania wagi" }, { status: 500 });
  }
}

/**
 * PUT /api/orders/[id]/items/[itemId]/weight - confirm weight from barcode scan
 * Extracts weight from scale barcode (format: PLU + weight, e.g., "2100123001234" where 12.34 is weight)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: orderId, itemId } = await params;
    const body = await request.json();
    const parsed = barcodeWeightSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { barcode } = parsed.data;

    let weight: number | null = null;
    if (barcode.length === 13 && barcode.startsWith("2")) {
      const weightStr = barcode.substring(7, 12);
      weight = parseInt(weightStr) / 1000;
    } else if (barcode.length === 8) {
      const weightStr = barcode.substring(2, 7);
      weight = parseInt(weightStr) / 1000;
    }

    if (weight === null || isNaN(weight) || weight <= 0) {
      return NextResponse.json(
        { error: "Nie można odczytać wagi z kodu kreskowego" },
        { status: 400 }
      );
    }

    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: {
        order: { select: { orderNumber: true } },
        product: { select: { name: true, priceGross: true } },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Pozycja nie istnieje" }, { status: 404 });
    }

    if (item.orderId !== orderId) {
      return NextResponse.json({ error: "Pozycja nie należy do tego zamówienia" }, { status: 400 });
    }

    if (!item.requiresWeightConfirm) {
      return NextResponse.json({ error: "Ta pozycja nie wymaga potwierdzenia wagi" }, { status: 400 });
    }

    const userId = request.headers.get("x-user-id");

    const updated = await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        weightConfirmed: true,
        confirmedWeight: weight,
        weightConfirmedAt: new Date(),
        weightConfirmedBy: userId,
        weightBarcodeScanned: barcode,
        quantity: weight,
        unitPrice: Number(item.product.priceGross),
      },
    });

    await auditLog(userId, "ORDER_ITEM_WEIGHT_BARCODE_SCANNED", "OrderItem", itemId, undefined, {
      orderId,
      productName: item.product.name,
      barcode,
      weight,
    });

    return NextResponse.json({
      item: {
        id: updated.id,
        weightConfirmed: updated.weightConfirmed,
        confirmedWeight: Number(updated.confirmedWeight),
        quantity: Number(updated.quantity),
        barcode,
        total: Number(updated.quantity) * Number(updated.unitPrice),
      },
    });
  } catch (e) {
    console.error("[Weight PUT]", e);
    return NextResponse.json({ error: "Błąd skanowania kodu wagowego" }, { status: 500 });
  }
}

/**
 * GET /api/orders/[id]/items/[itemId]/weight - get weight status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: orderId, itemId } = await params;

    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        orderId: true,
        requiresWeightConfirm: true,
        weightConfirmed: true,
        confirmedWeight: true,
        weightConfirmedAt: true,
        weightBarcodeScanned: true,
        quantity: true,
        unitPrice: true,
        product: { select: { name: true, unit: true } },
      },
    });

    if (!item || item.orderId !== orderId) {
      return NextResponse.json({ error: "Pozycja nie istnieje" }, { status: 404 });
    }

    return NextResponse.json({
      item: {
        id: item.id,
        productName: item.product.name,
        unit: item.product.unit,
        requiresWeightConfirm: item.requiresWeightConfirm,
        weightConfirmed: item.weightConfirmed,
        confirmedWeight: item.confirmedWeight ? Number(item.confirmedWeight) : null,
        weightConfirmedAt: item.weightConfirmedAt?.toISOString() ?? null,
        barcode: item.weightBarcodeScanned,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.quantity) * Number(item.unitPrice),
      },
    });
  } catch (e) {
    console.error("[Weight GET]", e);
    return NextResponse.json({ error: "Błąd pobierania statusu wagi" }, { status: 500 });
  }
}
