import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/reports/kitchen?dateFrom=&dateTo= — kitchen performance report
 * Returns timing data grouped by dish, station, and cook.
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

    // Fetch completed items with timing data
    const items = await prisma.orderItem.findMany({
      where: {
        status: { in: ["READY", "SERVED"] },
        readyAt: { gte: from, lte: to },
      },
      select: {
        id: true,
        productId: true,
        product: { select: { name: true, estimatedPrepMinutes: true, categoryId: true } },
        sentToKitchenAt: true,
        startedAt: true,
        readyAt: true,
        servedAt: true,
        preparedByUserId: true,
        kdsStationId: true,
        quantity: true,
      },
    });

    // --- Per dish stats ---
    const dishMap: Record<string, {
      productId: string;
      name: string;
      estimatedMinutes: number | null;
      count: number;
      prepTimes: number[];
      waitTimes: number[];
      totalTimes: number[];
    }> = {};

    for (const item of items) {
      const key = item.productId;
      if (!dishMap[key]) {
        dishMap[key] = {
          productId: item.productId,
          name: item.product.name,
          estimatedMinutes: item.product.estimatedPrepMinutes,
          count: 0,
          prepTimes: [],
          waitTimes: [],
          totalTimes: [],
        };
      }
      dishMap[key].count += Number(item.quantity);

      if (item.startedAt && item.readyAt) {
        dishMap[key].prepTimes.push((item.readyAt.getTime() - item.startedAt.getTime()) / 60000);
      }
      if (item.sentToKitchenAt && item.startedAt) {
        dishMap[key].waitTimes.push((item.startedAt.getTime() - item.sentToKitchenAt.getTime()) / 60000);
      }
      if (item.sentToKitchenAt && item.readyAt) {
        dishMap[key].totalTimes.push((item.readyAt.getTime() - item.sentToKitchenAt.getTime()) / 60000);
      }
    }

    const byDish = Object.values(dishMap).map((d) => ({
      productId: d.productId,
      name: d.name,
      estimatedMinutes: d.estimatedMinutes,
      count: d.count,
      avgPrepMinutes: avg(d.prepTimes),
      avgWaitMinutes: avg(d.waitTimes),
      avgTotalMinutes: avg(d.totalTimes),
      minPrepMinutes: d.prepTimes.length > 0 ? round(Math.min(...d.prepTimes)) : null,
      maxPrepMinutes: d.prepTimes.length > 0 ? round(Math.max(...d.prepTimes)) : null,
    })).sort((a, b) => b.count - a.count);

    // --- Per cook stats ---
    const cookMap: Record<string, {
      userId: string;
      count: number;
      prepTimes: number[];
    }> = {};

    for (const item of items) {
      if (!item.preparedByUserId) continue;
      const key = item.preparedByUserId;
      if (!cookMap[key]) {
        cookMap[key] = { userId: key, count: 0, prepTimes: [] };
      }
      cookMap[key].count += Number(item.quantity);
      if (item.startedAt && item.readyAt) {
        cookMap[key].prepTimes.push((item.readyAt.getTime() - item.startedAt.getTime()) / 60000);
      }
    }

    const cookIds = Object.keys(cookMap);
    const cooks = cookIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: cookIds } },
          select: { id: true, name: true },
        })
      : [];
    const cookNameMap = new Map(cooks.map((c) => [c.id, c.name]));

    const byCook = Object.values(cookMap).map((c) => ({
      userId: c.userId,
      name: cookNameMap.get(c.userId) ?? "Nieznany",
      itemsCompleted: c.count,
      avgPrepMinutes: avg(c.prepTimes),
      minPrepMinutes: c.prepTimes.length > 0 ? round(Math.min(...c.prepTimes)) : null,
      maxPrepMinutes: c.prepTimes.length > 0 ? round(Math.max(...c.prepTimes)) : null,
    })).sort((a, b) => b.itemsCompleted - a.itemsCompleted);

    // --- Per station stats ---
    const stationMap: Record<string, {
      stationId: string;
      count: number;
      prepTimes: number[];
    }> = {};

    for (const item of items) {
      if (!item.kdsStationId) continue;
      const key = item.kdsStationId;
      if (!stationMap[key]) {
        stationMap[key] = { stationId: key, count: 0, prepTimes: [] };
      }
      stationMap[key].count += Number(item.quantity);
      if (item.startedAt && item.readyAt) {
        stationMap[key].prepTimes.push((item.readyAt.getTime() - item.startedAt.getTime()) / 60000);
      }
    }

    const stationIds = Object.keys(stationMap);
    const stations = stationIds.length > 0
      ? await prisma.kDSStation.findMany({
          where: { id: { in: stationIds } },
          select: { id: true, name: true },
        })
      : [];
    const stationNameMap = new Map(stations.map((s) => [s.id, s.name]));

    const byStation = Object.values(stationMap).map((s) => ({
      stationId: s.stationId,
      name: stationNameMap.get(s.stationId) ?? "Nieznana",
      itemsCompleted: s.count,
      avgPrepMinutes: avg(s.prepTimes),
    })).sort((a, b) => b.itemsCompleted - a.itemsCompleted);

    // --- Summary ---
    const allPrepTimes = items
      .filter((i) => i.startedAt && i.readyAt)
      .map((i) => (i.readyAt!.getTime() - i.startedAt!.getTime()) / 60000);

    return NextResponse.json({
      dateFrom,
      dateTo,
      summary: {
        totalItems: items.length,
        avgPrepMinutes: avg(allPrepTimes),
        totalCooks: byCook.length,
        totalStations: byStation.length,
      },
      byDish,
      byCook,
      byStation,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd raportu kuchni" }, { status: 500 });
  }
}

function avg(arr: number[]): number | null {
  if (arr.length === 0) return null;
  return round(arr.reduce((s, v) => s + v, 0) / arr.length);
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
