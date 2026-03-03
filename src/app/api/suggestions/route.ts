export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, createSuggestionSchema } from "@/lib/validation";
import { autoExportConfigSnapshot } from "@/lib/config-snapshot";


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productIdParam = searchParams.get("productId");
    const productIdsParam = searchParams.get("productIds");
    const productIds: string[] = productIdsParam
      ? productIdsParam.split(",").map((id) => id.trim()).filter(Boolean)
      : productIdParam
        ? [productIdParam]
        : [];
    if (productIds.length === 0) {
      return NextResponse.json(
        { error: "Parametr productId lub productIds jest wymagany" },
        { status: 400 }
      );
    }

    const fetchGroup = async (productId: string) => {
      const [product, suggestions] = await Promise.all([
        prisma.product.findUnique({ where: { id: productId }, select: { id: true, name: true } }),
        prisma.productSuggestion.findMany({
          where: { productId, isActive: true },
          include: {
            suggested: {
              select: { id: true, name: true, priceGross: true, taxRateId: true },
            },
          },
          orderBy: { priority: "desc" },
          take: 4,
        }),
      ]);
      const list = suggestions.map((s) => ({
        id: s.suggestedId,
        name: s.suggested.name,
        priceGross: Number(s.suggested.priceGross),
        taxRateId: s.suggested.taxRateId,
        type: s.type,
        priority: s.priority,
        ...(s.note && { note: s.note }),
      }));
      return { productId, productName: product?.name ?? "", suggestions: list };
    };

    if (productIds.length === 1) {
      const group = await fetchGroup(productIds[0]);
      return NextResponse.json(group.suggestions);
    }

    const groups = await Promise.all(productIds.map(fetchGroup));
    const filtered = groups.filter((g) => g.suggestions.length > 0);
    return NextResponse.json({ grouped: true, groups: filtered });
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
