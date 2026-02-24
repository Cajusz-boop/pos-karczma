export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export async function generateStaticParams() {
  return [ {"id":"_"} ];
}



export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        stockItems: {
          include: { ingredient: true },
        },
      },
    });
    if (!warehouse) {
      return NextResponse.json({ error: "Magazyn nie istnieje" }, { status: 404 });
    }
    return NextResponse.json({
      id: warehouse.id,
      name: warehouse.name,
      type: warehouse.type,
      stockItems: warehouse.stockItems.map((s) => ({
        id: s.id,
        ingredientId: s.ingredientId,
        ingredientName: s.ingredient.name,
        quantity: Number(s.quantity),
        unit: s.unit,
        minQuantity: Number(s.minQuantity),
        lastDeliveryPrice: s.lastDeliveryPrice != null ? Number(s.lastDeliveryPrice) : null,
        status: getStockStatus(Number(s.quantity), Number(s.minQuantity)),
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania magazynu" }, { status: 500 });
  }
}

function getStockStatus(quantity: number, minQuantity: number): "OK" | "LOW" | "OUT" {
  if (quantity <= 0) return "OUT";
  if (minQuantity > 0 && quantity < minQuantity) return "LOW";
  return "OK";
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, type } = body as { name?: string; type?: string };
    const warehouse = await prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) {
      return NextResponse.json({ error: "Magazyn nie istnieje" }, { status: 404 });
    }
    const validTypes = ["MAIN", "BAR", "KITCHEN", "COLD_STORAGE"];
    const data: { name?: string; type?: "MAIN" | "BAR" | "KITCHEN" | "COLD_STORAGE" } = {};
    if (name != null && name.trim()) data.name = name.trim();
    if (type != null && validTypes.includes(type)) data.type = type as "MAIN" | "BAR" | "KITCHEN" | "COLD_STORAGE";
    const updated = await prisma.warehouse.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd aktualizacji magazynu" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: { stockItems: true },
    });
    if (!warehouse) {
      return NextResponse.json({ error: "Magazyn nie istnieje" }, { status: 404 });
    }
    if (warehouse.stockItems.length > 0) {
      return NextResponse.json(
        { error: "Nie można usunąć magazynu z pozycjami magazynowymi. Najpierw usuń stany lub przenieś je." },
        { status: 400 }
      );
    }
    await prisma.warehouse.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd usuwania magazynu" }, { status: 500 });
  }
}
