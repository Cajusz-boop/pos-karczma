import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, createWarehouseSchema } from "@/lib/validation";
import { autoExportConfigSnapshot } from "@/lib/config-snapshot";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { stockItems: true } },
      },
    });
    return NextResponse.json(
      warehouses.map((w) => ({
        id: w.id,
        name: w.name,
        type: w.type,
        stockItemsCount: w._count.stockItems,
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania magazynów" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data, error: valError } = await parseBody(request, createWarehouseSchema);
    if (valError) return valError;
    const { name, type } = data;
    const warehouse = await prisma.warehouse.create({
      data: { name: name.trim(), type: type as "MAIN" | "BAR" | "KITCHEN" | "COLD_STORAGE" },
    });
    autoExportConfigSnapshot();
    return NextResponse.json(warehouse);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd tworzenia magazynu" }, { status: 500 });
  }
}
