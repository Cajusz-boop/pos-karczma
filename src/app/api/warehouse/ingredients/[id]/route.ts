import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autoExportConfigSnapshot } from "@/lib/config-snapshot";
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return [ {"id":"_"} ];
}



export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ingredient = await prisma.ingredient.findUnique({
      where: { id },
      include: {
        stockItems: { include: { warehouse: true } },
      },
    });
    if (!ingredient) {
      return NextResponse.json({ error: "Składnik nie istnieje" }, { status: 404 });
    }
    return NextResponse.json({
      id: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit,
      category: ingredient.category,
      defaultSupplier: ingredient.defaultSupplier,
      stockItems: ingredient.stockItems.map((s) => ({
        id: s.id,
        warehouseId: s.warehouseId,
        warehouseName: s.warehouse.name,
        quantity: Number(s.quantity),
        minQuantity: Number(s.minQuantity),
        lastDeliveryPrice: s.lastDeliveryPrice != null ? Number(s.lastDeliveryPrice) : null,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania składnika" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, unit, category, defaultSupplier } = body as {
      name?: string;
      unit?: string;
      category?: string | null;
      defaultSupplier?: string | null;
    };
    const ingredient = await prisma.ingredient.findUnique({ where: { id } });
    if (!ingredient) {
      return NextResponse.json({ error: "Składnik nie istnieje" }, { status: 404 });
    }
    const data: { name?: string; unit?: string; category?: string | null; defaultSupplier?: string | null } = {};
    if (name != null) data.name = name.trim();
    if (unit != null) data.unit = unit.trim();
    if (category !== undefined) data.category = category?.trim() ?? null;
    if (defaultSupplier !== undefined) data.defaultSupplier = defaultSupplier?.trim() ?? null;
    const updated = await prisma.ingredient.update({
      where: { id },
      data,
    });
    autoExportConfigSnapshot();
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd aktualizacji składnika" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ingredient = await prisma.ingredient.findUnique({
      where: { id },
      include: { stockItems: true, recipeItems: true },
    });
    if (!ingredient) {
      return NextResponse.json({ error: "Składnik nie istnieje" }, { status: 404 });
    }
    if (ingredient.stockItems.length > 0 || ingredient.recipeItems.length > 0) {
      return NextResponse.json(
        { error: "Składnik jest używany w stanach lub recepturach. Najpierw usuń powiązania." },
        { status: 400 }
      );
    }
    await prisma.ingredient.delete({ where: { id } });
    autoExportConfigSnapshot();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd usuwania składnika" }, { status: 500 });
  }
}
