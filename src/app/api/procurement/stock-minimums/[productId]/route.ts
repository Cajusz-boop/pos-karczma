import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** PUT /api/procurement/stock-minimums/[productId] — ustaw minimum dla produktu recepturowego */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const numId = parseInt(productId, 10);
    if (isNaN(numId)) {
      return NextResponse.json(
        { error: "Nieprawidłowe ID produktu" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { minimum, unit } = body;

    if (typeof minimum !== "number" || minimum < 0) {
      return NextResponse.json(
        { error: "Minimum musi być liczbą nieujemną" },
        { status: 400 }
      );
    }

    const u = typeof unit === "string" && unit.trim() ? unit.trim() : "kg";

    const sm = await prisma.stockMinimum.upsert({
      where: { productId: numId },
      create: {
        productId: numId,
        minimum,
        unit: u,
      },
      update: {
        minimum,
        unit: u,
      },
      include: {
        product: { select: { id: true, name: true, defaultUnit: true } },
      },
    });

    return NextResponse.json({
      productId: sm.productId,
      productName: sm.product.name,
      minimum: sm.minimum,
      unit: sm.unit,
      updatedAt: sm.updatedAt,
    });
  } catch (e) {
    console.error("[procurement/stock-minimums PUT]", e);
    return NextResponse.json(
      { error: "Błąd ustawiania minimum" },
      { status: 500 }
    );
  }
}
