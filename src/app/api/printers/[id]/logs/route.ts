import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

/**
 * GET /api/printers/[id]/logs - get print logs for printer
 * 
 * Query params:
 * - days: number of days back (default 7, max 100)
 * - limit: max records (default 100, max 500)
 * - status: filter by status (PENDING, PRINTING, PRINTED, FAILED)
 * - type: filter by print type
 */
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export async function generateStaticParams() {
  return [ {"id":"_"} ];
}


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: printerId } = await params;
    const { searchParams } = new URL(request.url);
    
    const days = Math.min(parseInt(searchParams.get("days") ?? "7"), 100);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 500);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const logs = await prisma.printLog.findMany({
      where: {
        printerId,
        createdAt: { gte: fromDate },
        ...(status && { status: status as "PENDING" | "PRINTING" | "PRINTED" | "FAILED" }),
        ...(type && { printType: type as "KITCHEN_ORDER" | "KITCHEN_STORNO" | "KITCHEN_CHANGE" | "RECEIPT" | "INVOICE" | "REPORT" | "TEST" }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const stats = await prisma.printLog.groupBy({
      by: ["status"],
      where: {
        printerId,
        createdAt: { gte: fromDate },
      },
      _count: { status: true },
    });

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        printType: log.printType,
        orderId: log.orderId,
        orderNumber: log.orderNumber,
        status: log.status,
        errorMessage: log.errorMessage,
        createdAt: log.createdAt,
        printedAt: log.printedAt,
      })),
      stats: Object.fromEntries(stats.map((s) => [s.status, s._count.status])),
      period: { days, fromDate, toDate: new Date() },
    });
  } catch (e) {
    console.error("[PrinterLogs GET]", e);
    return NextResponse.json({ error: "Błąd pobierania logów" }, { status: 500 });
  }
}

/**
 * DELETE /api/printers/[id]/logs - clear old print logs
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: printerId } = await params;
    const { searchParams } = new URL(request.url);
    
    const olderThanDays = parseInt(searchParams.get("olderThanDays") ?? "100");
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.printLog.deleteMany({
      where: {
        printerId,
        createdAt: { lt: cutoffDate },
      },
    });

    return NextResponse.json({
      message: `Usunięto ${result.count} starych logów`,
      deletedCount: result.count,
      olderThan: cutoffDate,
    });
  } catch (e) {
    console.error("[PrinterLogs DELETE]", e);
    return NextResponse.json({ error: "Błąd usuwania logów" }, { status: 500 });
  }
}
