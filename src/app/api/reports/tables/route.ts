export const dynamic = 'force-dynamic';

﻿import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


/**
 * GET /api/reports/tables - sales report per table
 * 
 * Query params:
 * - from: start date
 * - to: end date
 * - roomId: filter by room
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const roomId = searchParams.get("roomId");

    const fromDate = from ? new Date(from) : new Date(new Date().setHours(0, 0, 0, 0));
    const toDate = to ? new Date(to) : new Date();

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: fromDate, lte: toDate },
        status: { in: ["CLOSED"] },
        tableId: { not: null },
        ...(roomId && { roomId }),
      },
      include: {
        table: { select: { id: true, number: true } },
        room: { select: { id: true, name: true } },
        items: {
          where: { status: { not: "CANCELLED" } },
          include: {
            product: {
              include: { category: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });

    const tableStats = new Map<string, {
      tableId: string;
      tableNumber: number;
      roomName: string;
      orderCount: number;
      guestCount: number;
      totalSales: number;
      categoryBreakdown: Map<string, { name: string; total: number; count: number }>;
    }>();

    for (const order of orders) {
      if (!order.table) continue;

      const tableId = order.table.id;
      let stats = tableStats.get(tableId);

      if (!stats) {
        stats = {
          tableId,
          tableNumber: order.table.number,
          roomName: order.room?.name ?? "Nieznana",
          orderCount: 0,
          guestCount: 0,
          totalSales: 0,
          categoryBreakdown: new Map(),
        };
        tableStats.set(tableId, stats);
      }

      stats.orderCount++;
      stats.guestCount += order.guestCount;

      for (const item of order.items) {
        const itemTotal = Number(item.quantity) * Number(item.unitPrice) - Number(item.discountAmount);
        stats.totalSales += itemTotal;

        const catId = item.product.categoryId;
        const catStats = stats.categoryBreakdown.get(catId) ?? {
          name: item.product.category.name,
          total: 0,
          count: 0,
        };
        catStats.total += itemTotal;
        catStats.count += Number(item.quantity);
        stats.categoryBreakdown.set(catId, catStats);
      }
    }

    const tableReports = Array.from(tableStats.values())
      .map((stats) => ({
        tableId: stats.tableId,
        tableNumber: stats.tableNumber,
        roomName: stats.roomName,
        orderCount: stats.orderCount,
        guestCount: stats.guestCount,
        totalSales: stats.totalSales,
        avgPerOrder: stats.orderCount > 0 ? stats.totalSales / stats.orderCount : 0,
        avgPerGuest: stats.guestCount > 0 ? stats.totalSales / stats.guestCount : 0,
        categories: Array.from(stats.categoryBreakdown.entries()).map(([id, data]) => ({
          categoryId: id,
          categoryName: data.name,
          total: data.total,
          count: data.count,
        })),
      }))
      .sort((a, b) => b.totalSales - a.totalSales);

    const grandTotal = tableReports.reduce((sum, t) => sum + t.totalSales, 0);
    const totalOrders = tableReports.reduce((sum, t) => sum + t.orderCount, 0);
    const totalGuests = tableReports.reduce((sum, t) => sum + t.guestCount, 0);

    return NextResponse.json({
      period: { from: fromDate, to: toDate },
      tables: tableReports,
      summary: {
        tableCount: tableReports.length,
        totalOrders,
        totalGuests,
        grandTotal,
        avgPerTable: tableReports.length > 0 ? grandTotal / tableReports.length : 0,
        avgPerOrder: totalOrders > 0 ? grandTotal / totalOrders : 0,
        avgPerGuest: totalGuests > 0 ? grandTotal / totalGuests : 0,
      },
    });
  } catch (e) {
    console.error("[ReportTables GET]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d generowania raportu" }, { status: 500 });
  }
}
