import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/reports/shift-extended - extended shift report
 * 
 * Query params:
 * - shiftId: specific shift
 * - from: start date
 * - to: end date
 * - userId: filter by user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shiftId = searchParams.get("shiftId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const userId = searchParams.get("userId");

    let fromDate: Date;
    let toDate: Date;

    if (shiftId) {
      const shift = await prisma.shift.findUnique({
        where: { id: shiftId },
      });
      if (!shift) {
        return NextResponse.json({ error: "Zmiana nie istnieje" }, { status: 404 });
      }
      fromDate = shift.startedAt;
      toDate = shift.endedAt ?? new Date();
    } else {
      fromDate = from ? new Date(from) : new Date(new Date().setHours(0, 0, 0, 0));
      toDate = to ? new Date(to) : new Date();
    }

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: fromDate, lte: toDate },
        status: { in: ["CLOSED"] },
        ...(userId && { userId }),
      },
      include: {
        items: {
          include: {
            product: {
              include: { category: { select: { id: true, name: true } } },
            },
          },
        },
        payments: true,
        user: { select: { name: true } },
      },
    });

    const categoryStats = new Map<string, { name: string; quantity: number; total: number }>();
    const printerStats = new Map<string, { name: string; quantity: number; total: number }>();
    const productStats = new Map<string, { name: string; category: string; quantity: number; total: number }>();
    const discountStats = { count: 0, total: 0, byType: new Map<string, number>() };
    const paymentStats = new Map<string, { count: number; total: number }>();

    let totalSales = 0;
    let totalOrders = orders.length;
    let totalGuests = 0;
    let receiptCount = 0;
    let invoiceCount = 0;
    let emptyOrderCount = 0;
    let cancelledItemCount = 0;
    let notFiscalized = 0;

    for (const order of orders) {
      totalGuests += order.guestCount;

      const activeItems = order.items.filter((i) => i.status !== "CANCELLED");
      const cancelledItems = order.items.filter((i) => i.status === "CANCELLED");
      cancelledItemCount += cancelledItems.length;

      if (activeItems.length === 0) {
        emptyOrderCount++;
        continue;
      }

      let orderTotal = 0;

      for (const item of activeItems) {
        const itemTotal = Number(item.quantity) * Number(item.unitPrice) - Number(item.discountAmount);
        orderTotal += itemTotal;

        const catId = item.product.categoryId;
        const catStats = categoryStats.get(catId) ?? { name: item.product.category.name, quantity: 0, total: 0 };
        catStats.quantity += Number(item.quantity);
        catStats.total += itemTotal;
        categoryStats.set(catId, catStats);

        const prodStats = productStats.get(item.productId) ?? {
          name: item.product.name,
          category: item.product.category.name,
          quantity: 0,
          total: 0,
        };
        prodStats.quantity += Number(item.quantity);
        prodStats.total += itemTotal;
        productStats.set(item.productId, prodStats);

        if (item.discountAmount && Number(item.discountAmount) > 0) {
          discountStats.count++;
          discountStats.total += Number(item.discountAmount);
        }
      }

      totalSales += orderTotal;

      for (const payment of order.payments) {
        const method = payment.method;
        const stats = paymentStats.get(method) ?? { count: 0, total: 0 };
        stats.count++;
        stats.total += Number(payment.amount);
        paymentStats.set(method, stats);

        if (method === "CASH") receiptCount++;
        if (method === "CARD") receiptCount++;
      }
    }

    return NextResponse.json({
      period: { from: fromDate, to: toDate },
      summary: {
        totalSales,
        totalOrders,
        totalGuests,
        avgPerOrder: totalOrders > 0 ? totalSales / totalOrders : 0,
        avgPerGuest: totalGuests > 0 ? totalSales / totalGuests : 0,
        receiptCount,
        invoiceCount,
        emptyOrderCount,
        cancelledItemCount,
        notFiscalized,
      },
      byCategory: Array.from(categoryStats.entries())
        .map(([id, data]) => ({ categoryId: id, ...data }))
        .sort((a, b) => b.total - a.total),
      byProduct: Array.from(productStats.entries())
        .map(([id, data]) => ({ productId: id, ...data }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 50),
      byPayment: Array.from(paymentStats.entries())
        .map(([method, data]) => ({ method, ...data })),
      discounts: {
        count: discountStats.count,
        total: discountStats.total,
      },
    });
  } catch (e) {
    console.error("[ReportShiftExtended GET]", e);
    return NextResponse.json({ error: "Błąd generowania raportu" }, { status: 500 });
  }
}
