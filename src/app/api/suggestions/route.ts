import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, createSuggestionSchema } from "@/lib/validation";
import { autoExportConfigSnapshot } from "@/lib/config-snapshot";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    if (!productId) {
      return NextResponse.json(
        { error: "Parametr productId jest wymagany" },
        { status: 400 }
      );
    }

    const suggestions = await prisma.productSuggestion.findMany({
      where: { productId, isActive: true },
      include: {
        suggested: {
          select: { id: true, name: true, priceGross: true, taxRateId: true },
        },
      },
      orderBy: { priority: "desc" },
    });

    const result = suggestions.map((s) => ({
      id: s.suggestedId,
      name: s.suggested.name,
      priceGross: Number(s.suggested.priceGross),
      taxRateId: s.suggested.taxRateId,
      type: s.type,
      priority: s.priority,
    }));

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Błąd pobierania sugestii produktów" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data, error: valError } = await parseBody(request, createSuggestionSchema);
    if (valError) return valError;
    const { productId, suggestedId, type, priority } = data;

    const [baseProduct, suggestedProduct] = await Promise.all([
      prisma.product.findUnique({ where: { id: productId } }),
      prisma.product.findUnique({ where: { id: suggestedId } }),
    ]);
    if (!baseProduct) {
      return NextResponse.json(
        { error: "Produkt bazowy nie istnieje" },
        { status: 404 }
      );
    }
    if (!suggestedProduct) {
      return NextResponse.json(
        { error: "Sugerowany produkt nie istnieje" },
        { status: 404 }
      );
    }
    if (productId === suggestedId) {
      return NextResponse.json(
        { error: "Produkt nie może sugerować samego siebie" },
        { status: 400 }
      );
    }

    const suggestion = await prisma.productSuggestion.create({
      data: {
        productId,
        suggestedId,
        type: type.trim(),
        priority: typeof priority === "number" ? priority : 0,
      },
      include: {
        suggested: {
          select: { id: true, name: true, priceGross: true },
        },
      },
    });

    autoExportConfigSnapshot();
    return NextResponse.json({
      id: suggestion.id,
      suggestedId: suggestion.suggestedId,
      name: suggestion.suggested.name,
      priceGross: Number(suggestion.suggested.priceGross),
      type: suggestion.type,
      priority: suggestion.priority,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Błąd tworzenia sugestii produktu" },
      { status: 500 }
    );
  }
}
