export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ phone: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { phone } = await context.params;
    const decodedPhone = decodeURIComponent(phone);
    if (!decodedPhone?.trim()) {
      return NextResponse.json(
        { error: "Numer telefonu jest wymagany" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { phone: decodedPhone.trim() },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            items: {
              include: {
                product: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Klient nie znaleziony" },
        { status: 404 }
      );
    }

    const ordersWithTotal = customer.orders.map((o) => {
      const total = o.items.reduce((sum, item) => {
        const price = Number(item.unitPrice) * Number(item.quantity);
        const discount = Number(item.discountAmount);
        return sum + price - discount;
      }, 0);
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        type: o.type,
        createdAt: o.createdAt,
        closedAt: o.closedAt,
        items: o.items.map((i) => ({
          id: i.id,
          productName: i.product.name,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          discountAmount: Number(i.discountAmount),
        })),
        total,
      };
    });

    return NextResponse.json({
      id: customer.id,
      phone: customer.phone,
      name: customer.name,
      email: customer.email,
      notes: customer.notes,
      visitCount: customer.visitCount,
      lastVisit: customer.lastVisit,
      createdAt: customer.createdAt,
      orders: ordersWithTotal,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Błąd pobierania danych klienta" },
      { status: 500 }
    );
  }
}
