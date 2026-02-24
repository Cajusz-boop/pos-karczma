export const dynamic = 'force-dynamic';

﻿import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


/**
 * GET /api/reports/bottleneck?dateFrom=&dateTo= â€” bottleneck analysis per table
 * Shows average wait times, prep times, and service times per table.
 * Identifies which tables/areas have the longest delays.
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

    // Get completed orders with timing data
    const orders = await prisma.order.findMany({
      where: {
        status: "CLOSED",
        closedAt: { gte: from, lte: to },
        tableId: { not: null },
      },
      include: {
        table: { select: { number: true, roomId: true } },
        room: { select: { name: true } },
        items: {
          where: { status: { in: ["READY", "SERVED"] } },
          select: {
            sentToKitchenAt: true,
            startedAt: true,
            readyAt: true,
            servedAt: true,
            product: { select: { name: true, estimatedPrepMinutes: true } },
          },
        },
      },
    });

    // Analyze per table
    const tableMap: Record<string, {
      tableNumber: number;
      roomName: string;
      orderCount: number;
      avgOrderDurationMinutes: number[];
      avgWaitMinutes: number[];
      avgPrepMinutes: number[];
      avgServiceMinutes: number[];
      overdueItems: number;
      totalItems: number;
    }> = {};

    for (const order of orders) {
      if (!order.tableId || !order.table) continue;
      const key = `${order.table.number}-${order.room?.name ?? ""}`;

      if (!tableMap[key]) {
        tableMap[key] = {
          tableNumber: order.table.number,
          roomName: order.room?.name ?? "",
          orderCount: 0,
          avgOrderDurationMinutes: [],
          avgWaitMinutes: [],
          avgPrepMinutes: [],
          avgServiceMinutes: [],
          overdueItems: 0,
          totalItems: 0,
        };
      }

      const t = tableMap[key];
      t.orderCount++;

      // Order duration (created -> closed)
      if (order.closedAt) {
        t.avgOrderDurationMinutes.push(
          (order.closedAt.getTime() - order.createdAt.getTime()) / 60000
        );
      }

      for (const item of order.items) {
        t.totalItems++;

        // Wait time (sent -> started)
        if (item.sentToKitchenAt && item.startedAt) {
          t.avgWaitMinutes.push(
            (item.startedAt.getTime() - item.sentToKitchenAt.getTime()) / 60000
          );
        }

        // Prep time (started -> ready)
        if (item.startedAt && item.readyAt) {
          const prepTime = (item.readyAt.getTime() - item.startedAt.getTime()) / 60000;
          t.avgPrepMinutes.push(prepTime);

          if (item.product.estimatedPrepMinutes && prepTime > item.product.estimatedPrepMinutes * 1.5) {
            t.overdueItems++;
          }
        }

        // Service time (ready -> served)
        if (item.readyAt && item.servedAt) {
          t.avgServiceMinutes.push(
            (item.servedAt.getTime() - item.readyAt.getTime()) / 60000
          );
        }
      }
    }

    const tables = Object.values(tableMap)
      .map((t) => ({
        tableNumber: t.tableNumber,
        roomName: t.roomName,
        orderCount: t.orderCount,
        totalItems: t.totalItems,
        avgOrderDurationMinutes: avg(t.avgOrderDurationMinutes),
        avgWaitMinutes: avg(t.avgWaitMinutes),
        avgPrepMinutes: avg(t.avgPrepMinutes),
        avgServiceMinutes: avg(t.avgServiceMinutes),
        overduePercent: t.totalItems > 0
          ? Math.round((t.overdueItems / t.totalItems) * 100)
          : 0,
        // Bottleneck score: higher = more problematic
        bottleneckScore: Math.round(
          (avg(t.avgWaitMinutes) ?? 0) * 2 +
          (avg(t.avgServiceMinutes) ?? 0) * 3 +
          (t.totalItems > 0 ? (t.overdueItems / t.totalItems) * 100 : 0)
        ),
      }))
      .sort((a, b) => b.bottleneckScore - a.bottleneckScore);

    // Identify bottleneck type
    const bottlenecks = tables.slice(0, 5).map((t) => {
      const issues: string[] = [];
      if ((t.avgWaitMinutes ?? 0) > 5) issues.push("DĹ‚ugi czas oczekiwania na kuchniÄ™");
      if ((t.avgServiceMinutes ?? 0) > 3) issues.push("DĹ‚ugi czas podania po przygotowaniu");
      if (t.overduePercent > 20) issues.push(`${t.overduePercent}% daĹ„ przekracza normÄ™`);
      return {
        ...t,
        issues,
      };
    });

    return NextResponse.json({
      dateFrom,
      dateTo,
      tables,
      topBottlenecks: bottlenecks,
      summary: {
        totalOrders: orders.length,
        avgOverallWaitMinutes: avg(tables.map((t) => t.avgWaitMinutes ?? 0).filter((v) => v > 0)),
        avgOverallPrepMinutes: avg(tables.map((t) => t.avgPrepMinutes ?? 0).filter((v) => v > 0)),
        avgOverallServiceMinutes: avg(tables.map((t) => t.avgServiceMinutes ?? 0).filter((v) => v > 0)),
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "BĹ‚Ä…d raportu wÄ…skich gardeĹ‚" }, { status: 500 });
  }
}

function avg(arr: number[]): number | null {
  if (arr.length === 0) return null;
  return Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10;
}
