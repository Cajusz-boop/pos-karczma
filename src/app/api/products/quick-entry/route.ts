import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/products/quick-entry - parse quick entry format
 * 
 * Supports formats:
 * - "1003" - just product code
 * - "2*1003" - quantity * product code
 * - "2*1003*5.50" - quantity * product code * price override
 * - "1003*5.50" - product code * price override
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, categoryId } = body;

    if (!input || typeof input !== "string") {
      return NextResponse.json({ error: "Brak wejścia" }, { status: 400 });
    }

    const parts = input.trim().split("*");
    let quantity = 1;
    let code: string;
    let priceOverride: number | null = null;

    if (parts.length === 1) {
      code = parts[0];
    } else if (parts.length === 2) {
      const first = parseFloat(parts[0]);
      const second = parseFloat(parts[1]);

      if (!isNaN(first) && first > 0 && first <= 999 && Number.isInteger(first) === false) {
        quantity = first;
        code = parts[1];
      } else if (!isNaN(first) && !isNaN(second) && second > 0 && second < 10000) {
        code = parts[0];
        priceOverride = second;
      } else {
        quantity = first || 1;
        code = parts[1];
      }
    } else if (parts.length === 3) {
      quantity = parseFloat(parts[0]) || 1;
      code = parts[1];
      priceOverride = parseFloat(parts[2]) || null;
    } else {
      return NextResponse.json({ error: "Nieprawidłowy format. Użyj: ILOŚĆ*KOD*CENA" }, { status: 400 });
    }

    const codeNum = parseInt(code);

    const whereClause = {
      isActive: true,
      ...(categoryId && { categoryId }),
      OR: [
        { sortOrder: codeNum || -1 },
        { id: { startsWith: code } },
      ],
    };

    const product = await prisma.product.findFirst({
      where: whereClause,
      include: {
        category: { select: { name: true } },
        taxRate: { select: { id: true, ratePercent: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: `Produkt o kodzie "${code}" nie znaleziony` }, { status: 404 });
    }

    const finalPrice = priceOverride ?? Number(product.priceGross);

    return NextResponse.json({
      parsed: {
        quantity,
        productCode: code,
        priceOverride,
      },
      product: {
        id: product.id,
        name: product.name,
        basePrice: Number(product.priceGross),
        finalPrice,
        taxRateId: product.taxRateId,
        categoryName: product.category.name,
      },
      orderItem: {
        productId: product.id,
        quantity,
        unitPrice: finalPrice,
        taxRateId: product.taxRateId,
      },
    });
  } catch (e) {
    console.error("[QuickEntry POST]", e);
    return NextResponse.json({ error: "Błąd parsowania" }, { status: 500 });
  }
}
