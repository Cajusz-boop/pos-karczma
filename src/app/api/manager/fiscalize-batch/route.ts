import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

/**
 * GET /api/manager/fiscalize-batch - list orders pending fiscalization
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // TAKEAWAY, PHONE, etc.

    const orders = await prisma.order.findMany({
      where: {
        status: { in: ["PAID", "CLOSED"] },
        fiscalizedAt: null,
        ...(type && { type: type as "DINE_IN" | "TAKEAWAY" | "PHONE" }),
      },
      include: {
        table: { select: { number: true } },
        user: { select: { name: true } },
        payments: true,
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    const totalAmount = orders.reduce((sum, o) => {
      return sum + o.payments.reduce((ps, p) => ps + Number(p.amount), 0);
    }, 0);

    return NextResponse.json({
      pendingCount: orders.length,
      totalAmount,
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        type: o.type,
        tableNumber: o.table?.number,
        waiterName: o.user?.name,
        total: o.payments.reduce((sum, p) => sum + Number(p.amount), 0),
        createdAt: o.createdAt,
      })),
    });
  } catch (e) {
    console.error("[FiscalizeBatch GET]", e);
    return NextResponse.json({ error: "Błąd pobierania" }, { status: 500 });
  }
}

/**
 * POST /api/manager/fiscalize-batch - fiscalize selected orders
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderIds } = body as { orderIds: string[] };

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: "Brak zamówień do fiskalizacji" }, { status: 400 });
    }

    const now = new Date();
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const orderId of orderIds) {
      try {
        await prisma.order.update({
          where: { id: orderId },
          data: { fiscalizedAt: now },
        });
        results.success++;
      } catch {
        results.failed++;
        results.errors.push(`Zamówienie ${orderId}: błąd aktualizacji`);
      }
    }

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "BATCH_FISCALIZATION", "Order", undefined, undefined, {
      count: orderIds.length,
      success: results.success,
      failed: results.failed,
    });

    return NextResponse.json({
      message: `Zafiskalizowano ${results.success} z ${orderIds.length} zamówień`,
      results,
    });
  } catch (e) {
    console.error("[FiscalizeBatch POST]", e);
    return NextResponse.json({ error: "Błąd fiskalizacji" }, { status: 500 });
  }
}
