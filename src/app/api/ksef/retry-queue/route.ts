import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { retryOfflineQueue } from "@/lib/ksef";

/**
 * GET /api/ksef/retry-queue — list queued invoices
 */
export async function GET() {
  try {
    const queued = await prisma.invoice.findMany({
      where: { ksefStatus: "OFFLINE_QUEUED" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        invoiceNumber: true,
        type: true,
        buyerName: true,
        grossTotal: true,
        ksefErrorMessage: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      count: queued.length,
      invoices: queued.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        type: inv.type,
        buyerName: inv.buyerName,
        grossTotal: Number(inv.grossTotal),
        errorMessage: inv.ksefErrorMessage,
        createdAt: inv.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania kolejki" }, { status: 500 });
  }
}

/**
 * POST /api/ksef/retry-queue — retry all queued invoices
 */
export async function POST() {
  try {
    const result = await retryOfflineQueue();
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd ponownej wysyłki" }, { status: 500 });
  }
}
