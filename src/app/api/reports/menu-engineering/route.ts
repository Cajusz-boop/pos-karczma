export const dynamic = 'force-dynamic';

﻿import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


/**
 * Menu Engineering BCG Matrix
 * Stars (Gwiazdy): high popularity + high margin
 * Plowhorses (Konie): high popularity + low margin
 * Puzzles (Zagadki): low popularity + high margin
 * Dogs (Psy): low popularity + low margin
 */

type BCGCategory = "STAR" | "PLOWHORSE" | "PUZZLE" | "DOG";

interface MenuEngineeringItem {
  productId: string;
  productName: string;
  categoryName: string;
  priceGross: number;
  costPrice: number;
  margin: number;
  marginPercent: number;
  qtySold: number;
  totalRevenue: number;
  totalMargin: number;
  popularityIndex: number;
  marginIndex: number;
  bcgCategory: BCGCategory;
  recommendation: string;
}

const RECOMMENDATIONS: Record<BCGCategory, string> = {
  STAR: "Promuj i utrzymaj â€” to Twoje najlepsze dania. Daj im widoczne miejsce w menu.",
  PLOWHORSE: "ZwiÄ™ksz marĹĽÄ™ â€” popularne, ale maĹ‚o zyskowne. PodnieĹ› cenÄ™ lub zmniejsz porcjÄ™.",
  PUZZLE: "ZwiÄ™ksz sprzedaĹĽ â€” zyskowne, ale maĹ‚o popularne. Lepsze zdjÄ™cie, sugestia kelnera.",
  DOG: "RozwaĹĽ usuniÄ™cie â€” ani popularne, ani zyskowne. ZamieĹ„ na nowe danie lub popraw recepturÄ™.",
};

const BCG_LABELS: Record<BCGCategory, string> = {
  STAR: "â­ Gwiazda",
  PLOWHORSE: "đź´ KoĹ„",
  PUZZLE: "đź§© Zagadka",
  DOG: "đź• Pies",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const categoryId = searchParams.get("categoryId");

    const dateFrom = from ? new Date(from) : new Date(new Date().setDate(new Date().getDate() - 30));
    const dateTo = to ? new Date(to + "T23:59:59") : new Date();

    // Get products
    const productWhere: Record<string, unknown> = { isActive: true };
    if (categoryId) productWhere.categoryId = categoryId;

    const products = await prisma.product.findMany({
      where: productWhere,
      include: { category: { select: { name: true } } },
    });

    // Get sales data
    const salesData = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        status: { not: "CANCELLED" },
        order: {
          status: "CLOSED",
          closedAt: { gte: dateFrom, lte: dateTo },
        },
        ...(categoryId ? { product: { categoryId } } : {}),
      },
      _sum: { quantity: true },
    });

    const salesMap = new Map(
      salesData.map((s) => [s.productId, Number(s._sum.quantity ?? 0)])
    );

    // Revenue per product
    const revenueItems = await prisma.orderItem.findMany({
      where: {
        status: { not: "CANCELLED" },
        order: {
          status: "CLOSED",
          closedAt: { gte: dateFrom, lte: dateTo },
        },
        ...(categoryId ? { product: { categoryId } } : {}),
      },
      select: { productId: true, quantity: true, unitPrice: true, discountAmount: true },
    });

    const revenueMap = new Map<string, number>();
    for (const item of revenueItems) {
      const rev = Number(item.quantity) * Number(item.unitPrice) - Number(item.discountAmount ?? 0);
      revenueMap.set(item.productId, (revenueMap.get(item.productId) ?? 0) + rev);
    }

    // Build items
    const items: MenuEngineeringItem[] = [];
    for (const p of products) {
      const priceGross = Number(p.priceGross);
      const costPrice = Number(p.costPrice ?? 0);
      const margin = priceGross - costPrice;
      const qtySold = salesMap.get(p.id) ?? 0;
      const totalRevenue = revenueMap.get(p.id) ?? 0;
      const totalMargin = margin * qtySold;

      items.push({
        productId: p.id,
        productName: p.name,
        categoryName: p.category.name,
        priceGross,
        costPrice,
        margin: Math.round(margin * 100) / 100,
        marginPercent: priceGross > 0 ? Math.round((margin / priceGross) * 1000) / 10 : 0,
        qtySold,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalMargin: Math.round(totalMargin * 100) / 100,
        popularityIndex: 0,
        marginIndex: 0,
        bcgCategory: "DOG",
        recommendation: "",
      });
    }

    // Calculate averages for BCG classification
    const totalQtySold = items.reduce((s, i) => s + i.qtySold, 0);
    const avgQty = items.length > 0 ? totalQtySold / items.length : 0;
    const avgMargin = items.length > 0
      ? items.reduce((s, i) => s + i.margin, 0) / items.length
      : 0;

    // Classify
    for (const item of items) {
      const highPopularity = item.qtySold >= avgQty * 0.7; // 70% of average = threshold
      const highMargin = item.margin >= avgMargin;

      item.popularityIndex = avgQty > 0 ? Math.round((item.qtySold / avgQty) * 100) / 100 : 0;
      item.marginIndex = avgMargin > 0 ? Math.round((item.margin / avgMargin) * 100) / 100 : 0;

      if (highPopularity && highMargin) {
        item.bcgCategory = "STAR";
      } else if (highPopularity && !highMargin) {
        item.bcgCategory = "PLOWHORSE";
      } else if (!highPopularity && highMargin) {
        item.bcgCategory = "PUZZLE";
      } else {
        item.bcgCategory = "DOG";
      }
      item.recommendation = RECOMMENDATIONS[item.bcgCategory];
    }

    // Sort by total margin descending
    items.sort((a, b) => b.totalMargin - a.totalMargin);

    const counts = {
      stars: items.filter((i) => i.bcgCategory === "STAR").length,
      plowhorses: items.filter((i) => i.bcgCategory === "PLOWHORSE").length,
      puzzles: items.filter((i) => i.bcgCategory === "PUZZLE").length,
      dogs: items.filter((i) => i.bcgCategory === "DOG").length,
    };

    return NextResponse.json({
      period: { from: dateFrom.toISOString(), to: dateTo.toISOString() },
      averages: {
        avgQtySold: Math.round(avgQty * 10) / 10,
        avgMargin: Math.round(avgMargin * 100) / 100,
      },
      counts,
      labels: BCG_LABELS,
      items,
    });
  } catch (e) {
    console.error("[Menu Engineering]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d raportu menu engineering" }, { status: 500 });
  }
}
