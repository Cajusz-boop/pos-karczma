export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export async function generateStaticParams() {
  return [ {"id":"_"} ];
}



export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { table: true, payments: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 404 });
    }
    if (order.status === "CLOSED") {
      return NextResponse.json({ error: "Nie można anulować zamkniętego zamówienia" }, { status: 400 });
    }
    if (order.status === "CANCELLED") {
      return NextResponse.json({ error: "Zamówienie jest już anulowane" }, { status: 400 });
    }
    if (order.payments.length > 0) {
      return NextResponse.json(
        { error: "Nie można anulować zamówienia z zarejestrowanymi płatnościami. Najpierw usuń płatności." },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });
      if (order.tableId) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: "FREE" },
        });
      }
    });

    await auditLog(null, "ORDER_CANCELLED", "Order", orderId, { status: order.status }, { status: "CANCELLED" });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd anulowania zamówienia" }, { status: 500 });
  }
}
