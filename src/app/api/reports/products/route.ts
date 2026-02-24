export const dynamic = 'force-dynamic';

﻿import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";


/** GET /api/reports/products?dateFrom=&dateTo=&categoryId=&roomId=&userId= â€” raport produktowy TOP/BOTTOM */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const categoryId = searchParams.get("categoryId");
    const roomId = searchParams.get("roomId");
    const userId = searchParams.get("userId");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);

    if (!dateFrom || !dateTo) {
      return NextResponse.json({ error: "Wymagane: dateFrom, dateTo (YYYY-MM-DD)" }, { status: 400 });
    }
    const from = startOfDay(new Date(dateFrom));
    const to = endOfDay(new Date(dateTo));

    const orderWhere: Prisma.OrderWhereInput = {
      status: "CLOSED",
      closedAt: { gte: from, lte: to },
    };
    if (roomId) orderWhere.roomId = roomId;
    if (userId) orderWhere.userId = userId;

    const itemWhere: Prisma.OrderItemWhereInput = {
      status: { not: "CANCELLED" },
      order: orderWhere,
    };
    if (categoryId) itemWhere.product = { categoryId };

    const items = await prisma.orderItem.findMany({
      where: itemWhere,
      include: { product: { select: { id: true, name: true, categoryId: true } } },
    });

    const byProduct: Record<string, { productId: string; name: string; qty: number; gross: number }> = {};
    for (const item of items) {
      const id = item.productId;
      if (!byProduct[id]) byProduct[id] = { productId: id, name: item.product.name, qty: 0, gross: 0 };
      byProduct[id].qty += Number(item.quantity);
      byProduct[id].gross += Number(item.quantity) * Number(item.unitPrice) - Number(item.discountAmount ?? 0);
    }

    const list = Object.values(byProduct)
      .map((v) => ({ ...v, qty: Math.round(v.qty * 1000) / 1000, gross: Math.round(v.gross * 100) / 100 }))
      .sort((a, b) => b.gross - a.gross);

    const topByValue = list.slice(0, limit);
    const topByQty = [...list].sort((a, b) => b.qty - a.qty).slice(0, limit);
    const bottomByValue = list.slice(-limit).reverse();
    const bottomByQty = [...list].sort((a, b) => a.qty - b.qty).slice(0, limit);

    return NextResponse.json({
      dateFrom: dateFrom.slice(0, 10),
      dateTo: dateTo.slice(0, 10),
      topByValue,
      topByQty,
      bottomByValue,
      bottomByQty,
      totalProducts: list.length,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "BĹ‚Ä…d raportu produktowego" }, { status: 500 });
  }
}
