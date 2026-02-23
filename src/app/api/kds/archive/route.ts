import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

/**
 * GET /api/kds/archive - get archived KDS orders
 * 
 * Query params:
 * - stationId: filter by station
 * - from: start date
 * - to: end date
 * - limit: max results (default 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stationId = searchParams.get("stationId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 500);

    const where: Record<string, unknown> = {};

    if (stationId) {
      where.stationId = stationId;
    }

    if (from || to) {
      where.completedAt = {};
      if (from) {
        (where.completedAt as Record<string, unknown>).gte = new Date(from);
      }
      if (to) {
        (where.completedAt as Record<string, unknown>).lte = new Date(to);
      }
    }

    const archives = await prisma.kDSOrderArchive.findMany({
      where,
      orderBy: { completedAt: "desc" },
      take: limit,
      include: {
        station: { select: { name: true } },
      },
    });

    const stats = await prisma.kDSOrderArchive.aggregate({
      where,
      _avg: { totalPrepTime: true },
      _min: { totalPrepTime: true },
      _max: { totalPrepTime: true },
      _count: { id: true },
    });

    return NextResponse.json({
      archives: archives.map((a) => ({
        id: a.id,
        stationId: a.stationId,
        stationName: a.station.name,
        orderId: a.orderId,
        orderNumber: a.orderNumber,
        tableNumber: a.tableNumber,
        waiterName: a.waiterName,
        itemCount: Array.isArray(a.itemsJson) ? (a.itemsJson as unknown[]).length : 0,
        receivedAt: a.receivedAt,
        completedAt: a.completedAt,
        prepTimeSeconds: a.totalPrepTime,
        prepTimeFormatted: formatTime(a.totalPrepTime),
      })),
      stats: {
        count: stats._count.id,
        avgPrepTime: stats._avg.totalPrepTime ? formatTime(Math.round(stats._avg.totalPrepTime)) : null,
        minPrepTime: stats._min.totalPrepTime ? formatTime(stats._min.totalPrepTime) : null,
        maxPrepTime: stats._max.totalPrepTime ? formatTime(stats._max.totalPrepTime) : null,
      },
    });
  } catch (e) {
    console.error("[KDSArchive GET]", e);
    return NextResponse.json({ error: "Błąd pobierania archiwum" }, { status: 500 });
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * POST /api/kds/archive - archive completed order
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stationId, orderId, orderNumber, tableNumber, waiterName, items, receivedAt, completedAt } = body;

    if (!stationId || !orderId) {
      return NextResponse.json({ error: "Brak wymaganych pól" }, { status: 400 });
    }

    const received = new Date(receivedAt ?? Date.now());
    const completed = new Date(completedAt ?? Date.now());
    const totalPrepTime = Math.round((completed.getTime() - received.getTime()) / 1000);

    const archive = await prisma.kDSOrderArchive.create({
      data: {
        stationId,
        orderId,
        orderNumber: orderNumber ?? 0,
        tableNumber,
        waiterName,
        itemsJson: items ?? [],
        receivedAt: received,
        completedAt: completed,
        totalPrepTime,
      },
    });

    return NextResponse.json({ archive }, { status: 201 });
  } catch (e) {
    console.error("[KDSArchive POST]", e);
    return NextResponse.json({ error: "Błąd archiwizacji" }, { status: 500 });
  }
}

/**
 * DELETE /api/kds/archive - clear old archives
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const olderThanDays = parseInt(searchParams.get("olderThanDays") ?? "30");

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    const result = await prisma.kDSOrderArchive.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    return NextResponse.json({
      message: `Usunięto ${result.count} archiwalnych wpisów`,
      deletedCount: result.count,
    });
  } catch (e) {
    console.error("[KDSArchive DELETE]", e);
    return NextResponse.json({ error: "Błąd usuwania archiwum" }, { status: 500 });
  }
}
