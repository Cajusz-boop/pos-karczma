import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return [ {"id":"_"} ];
}



export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { minQuantity, quantity } = body as { minQuantity?: number; quantity?: number };

    const stockItem = await prisma.stockItem.findUnique({ where: { id } });
    if (!stockItem) {
      return NextResponse.json({ error: "Pozycja nie istnieje" }, { status: 404 });
    }

    const data: { minQuantity?: number; quantity?: number } = {};
    if (minQuantity !== undefined) data.minQuantity = Math.max(0, Number(minQuantity));
    if (quantity !== undefined) data.quantity = Math.max(0, Number(quantity));

    const updated = await prisma.stockItem.update({
      where: { id },
      data,
    });
    return NextResponse.json({
      id: updated.id,
      quantity: Number(updated.quantity),
      minQuantity: Number(updated.minQuantity),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd aktualizacji pozycji" }, { status: 500 });
  }
}
