import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subHours, startOfDay, endOfDay } from "date-fns";

/**
 * GET /api/kitchen/load?hours=24&stationId= — KDS load history
 * Returns load snapshots for the specified period.
 */
export async function GET(request: NextRequest) {
  try {
    const hours = parseInt(request.nextUrl.searchParams.get("hours") ?? "24");
    const stationId = request.nextUrl.searchParams.get("stationId");
    const since = subHours(new Date(), hours);

    const where: Record<string, unknown> = {
      timestamp: { gte: since },
    };
    if (stationId) where.stationId = stationId;

    const snapshots = await prisma.kDSLoadSnapshot.findMany({
      where,
      orderBy: { timestamp: "asc" },
    });

    return NextResponse.json({
      snapshots: snapshots.map((s) => ({
        id: s.id,
        stationId: s.stationId,
        pendingCount: s.pendingCount,
        inProgressCount: s.inProgressCount,
        readyCount: s.readyCount,
        totalActive: s.totalActive,
        timestamp: s.timestamp.toISOString(),
      })),
      count: snapshots.length,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd historii obłożenia" }, { status: 500 });
  }
}

/**
 * POST /api/kitchen/load — record current KDS load snapshot
 * Called periodically (e.g., every 5 minutes) by the KDS page or a cron job.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const stationId = (body as { stationId?: string }).stationId ?? null;

    // Count current items by status
    const stationFilter = stationId
      ? {
          product: {
            category: {
              kdsStations: { some: { stationId } },
            },
          },
        }
      : {};

    const [pending, inProgress, ready] = await Promise.all([
      prisma.orderItem.count({
        where: {
          status: "SENT",
          sentToKitchenAt: { not: null },
          ...stationFilter,
        },
      }),
      prisma.orderItem.count({
        where: { status: "IN_PROGRESS", ...stationFilter },
      }),
      prisma.orderItem.count({
        where: { status: "READY", ...stationFilter },
      }),
    ]);

    const snapshot = await prisma.kDSLoadSnapshot.create({
      data: {
        stationId,
        pendingCount: pending,
        inProgressCount: inProgress,
        readyCount: ready,
        totalActive: pending + inProgress + ready,
      },
    });

    // Cleanup old snapshots (keep last 7 days)
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await prisma.kDSLoadSnapshot.deleteMany({
      where: { timestamp: { lt: cutoff } },
    });

    return NextResponse.json({
      id: snapshot.id,
      pendingCount: snapshot.pendingCount,
      inProgressCount: snapshot.inProgressCount,
      readyCount: snapshot.readyCount,
      totalActive: snapshot.totalActive,
      timestamp: snapshot.timestamp.toISOString(),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd zapisu obłożenia" }, { status: 500 });
  }
}
