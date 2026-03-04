import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/procurement/stock-minimums — stany minimalne */
export async function GET() {
  try {
    const items = await prisma.stockMinimum.findMany({
      include: {
        product: { select: { id: true, name: true, defaultUnit: true } },
      },
      orderBy: { product: { name: "asc" } },
    });

    return NextResponse.json(
      items.map((m) => ({
        productId: m.productId,
        productName: m.product.name,
        minimum: m.minimum,
        unit: m.unit,
        updatedAt: m.updatedAt,
      }))
    );
  } catch (e) {
    console.error("[procurement/stock-minimums GET]", e);
    return NextResponse.json(
      { error: "Błąd pobierania stanów minimalnych" },
      { status: 500 }
    );
  }
}
