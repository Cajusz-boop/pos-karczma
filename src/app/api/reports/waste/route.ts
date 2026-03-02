export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


/**
 * GET /api/reports/waste?dateFrom=&dateTo= "” waste/loss analysis
 * Cancelled items cost, grouped by product, reason, and stage.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if (!dateFrom || !dateTo) {
      return NextResponse.json({ error: "Wymagane parametry: dateFrom, dateTo" }, { status: 400 });
    }

    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);

    const cancelledItems = await prisma.orderItem.findMany({
      where: {
        status: "CANCELLED",
        cancelledAt: { gte: from, lte: to },
      },
      include: {
        product: { select: { id: true, name: true, categoryId: true, category: { select: { name: true } } } },
        order: { select: { orderNumber: true, userId: true } },
      },
    });

    let totalLoss = 0;
    let totalItems = 0;

    // Group by product
    const byProduct: Record<string, {
      productId: string;
      name: string;
      categoryName: string;
      count: number;
      totalCost: number;
      reasons: Record<string, number>;
    }> = {};

    // Group by reason
    const byReason: Record<string, { reason: string; count: number; totalCost: number }> = {};

    // Group by stage (when was it cancelled)
    const byStage: Record<string, { stage: string; count: number; totalCost: number }> = {};

    for (const item of cancelledItems) {
      const cost = Number(item.quantity) * Number(item.unitPrice);
      totalLoss += cost;
      totalItems += 1;

      // By product
      const pid = item.productId;
      if (!byProduct[pid]) {
        byProduct[pid] = {
          productId: pid,
          name: item.product.name,
          categoryName: item.product.category.name,
          count: 0,
          totalCost: 0,
          reasons: {},
        };
      }
      byProduct[pid].count += 1;
      byProduct[pid].totalCost += cost;
      const reason = item.cancelReason ?? "Brak powodu";
      byProduct[pid].reasons[reason] = (byProduct[pid].reasons[reason] ?? 0) + 1;

      // By reason
      if (!byReason[reason]) {
        byReason[reason] = { reason, count: 0, totalCost: 0 };
      }
      byReason[reason].count += 1;
      byReason[reason].totalCost += cost;

      // By stage (determine at which stage it was cancelled)
      let stage = "Przed wysłaniem";
      if (item.sentToKitchenAt) {
        stage = "Po wysłaniu do kuchni";
        if (item.startedAt) stage = "W trakcie przygotowania";
        if (item.readyAt) stage = "Po przygotowaniu";
        if (item.servedAt) stage = "Po podaniu";
      }
      if (!byStage[stage]) {
        byStage[stage] = { stage, count: 0, totalCost: 0 };
      }
      byStage[stage].count += 1;
      byStage[stage].totalCost += cost;
    }

    // Sort by cost descending
    const productList = Object.values(byProduct)
      .map((p) => ({ ...p, totalCost: round(p.totalCost) }))
      .sort((a, b) => b.totalCost - a.totalCost);

    const reasonList = Object.values(byReason)
      .map((r) => ({ ...r, totalCost: round(r.totalCost) }))
      .sort((a, b) => b.totalCost - a.totalCost);

    const stageList = Object.values(byStage)
      .map((s) => ({ ...s, totalCost: round(s.totalCost) }))
      .sort((a, b) => b.totalCost - a.totalCost);

    return NextResponse.json({
      dateFrom,
      dateTo,
      summary: {
        totalItems,
        totalLoss: round(totalLoss),
        uniqueProducts: productList.length,
      },
      byProduct: productList,
      byReason: reasonList,
      byStage: stageList,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd raportu strat" }, { status: 500 });
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
