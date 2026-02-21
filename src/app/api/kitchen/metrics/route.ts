import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

/**
 * GET /api/kitchen/metrics — real-time and daily kitchen metrics
 */
export async function GET() {
  try {
    const now = new Date();
    const dayStart = startOfDay(now);
    const dayEnd = endOfDay(now);

    // Real-time: items in each status
    const [pendingItems, inProgressItems, readyItems] = await Promise.all([
      prisma.orderItem.count({
        where: { status: "SENT", sentToKitchenAt: { not: null } },
      }),
      prisma.orderItem.count({
        where: { status: "IN_PROGRESS" },
      }),
      prisma.orderItem.count({
        where: { status: "READY" },
      }),
    ]);

    // Today's completed items with timing data
    const completedToday = await prisma.orderItem.findMany({
      where: {
        status: { in: ["READY", "SERVED"] },
        readyAt: { gte: dayStart, lte: dayEnd },
        startedAt: { not: null },
      },
      select: {
        startedAt: true,
        readyAt: true,
        sentToKitchenAt: true,
        servedAt: true,
        product: { select: { name: true, estimatedPrepMinutes: true } },
        preparedByUserId: true,
      },
    });

    // Calculate average prep time (startedAt -> readyAt)
    const prepTimes = completedToday
      .filter((i) => i.startedAt && i.readyAt)
      .map((i) => (i.readyAt!.getTime() - i.startedAt!.getTime()) / 60000);

    const avgPrepMinutes = prepTimes.length > 0
      ? Math.round((prepTimes.reduce((s, t) => s + t, 0) / prepTimes.length) * 10) / 10
      : null;

    // Calculate average wait time (sentToKitchenAt -> startedAt)
    const waitTimes = completedToday
      .filter((i) => i.sentToKitchenAt && i.startedAt)
      .map((i) => (i.startedAt!.getTime() - i.sentToKitchenAt!.getTime()) / 60000);

    const avgWaitMinutes = waitTimes.length > 0
      ? Math.round((waitTimes.reduce((s, t) => s + t, 0) / waitTimes.length) * 10) / 10
      : null;

    // Calculate average total time (sentToKitchenAt -> readyAt)
    const totalTimes = completedToday
      .filter((i) => i.sentToKitchenAt && i.readyAt)
      .map((i) => (i.readyAt!.getTime() - i.sentToKitchenAt!.getTime()) / 60000);

    const avgTotalMinutes = totalTimes.length > 0
      ? Math.round((totalTimes.reduce((s, t) => s + t, 0) / totalTimes.length) * 10) / 10
      : null;

    // Items exceeding estimated prep time
    const overdue = completedToday.filter((i) => {
      if (!i.startedAt || !i.readyAt || !i.product.estimatedPrepMinutes) return false;
      const actual = (i.readyAt.getTime() - i.startedAt.getTime()) / 60000;
      return actual > i.product.estimatedPrepMinutes * 1.5;
    }).length;

    // Cook performance (items per cook today)
    const cookStats: Record<string, number> = {};
    for (const item of completedToday) {
      if (item.preparedByUserId) {
        cookStats[item.preparedByUserId] = (cookStats[item.preparedByUserId] ?? 0) + 1;
      }
    }

    // Get cook names
    const cookIds = Object.keys(cookStats);
    const cooks = cookIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: cookIds } },
          select: { id: true, name: true },
        })
      : [];

    const cookPerformance = cooks.map((c) => ({
      userId: c.id,
      name: c.name,
      itemsCompleted: cookStats[c.id] ?? 0,
    })).sort((a, b) => b.itemsCompleted - a.itemsCompleted);

    // Today's totals
    const totalSentToday = await prisma.orderItem.count({
      where: {
        sentToKitchenAt: { gte: dayStart, lte: dayEnd },
        status: { not: "CANCELLED" },
      },
    });

    const totalCompletedToday = completedToday.length;

    // Cancelled today
    const cancelledToday = await prisma.orderItem.count({
      where: {
        status: "CANCELLED",
        cancelledAt: { gte: dayStart, lte: dayEnd },
      },
    });

    return NextResponse.json({
      realtime: {
        pending: pendingItems,
        inProgress: inProgressItems,
        ready: readyItems,
      },
      today: {
        totalSent: totalSentToday,
        totalCompleted: totalCompletedToday,
        cancelled: cancelledToday,
        avgPrepMinutes,
        avgWaitMinutes,
        avgTotalMinutes,
        overdueCount: overdue,
      },
      cookPerformance,
      timestamp: now.toISOString(),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd metryk kuchni" }, { status: 500 });
  }
}
