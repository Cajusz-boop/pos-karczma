export const dynamic = 'force-dynamic';

﻿import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, createCustomerSchema } from "@/lib/validation";


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    if (!phone?.trim()) {
      return NextResponse.json(
        { error: "Parametr phone jest wymagany do wyszukiwania" },
        { status: 400 }
      );
    }

    const customers = await prisma.customer.findMany({
      where: {
        phone: { contains: phone.trim() },
      },
      include: {
        orders: {
          where: { status: "CLOSED" },
          orderBy: { closedAt: "desc" },
          take: 5,
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

    const result = customers.map((c) => {
      const ordersWithTotal = c.orders.map((o) => {
        const total = o.items.reduce((sum, item) => {
          const price = Number(item.unitPrice) * Number(item.quantity);
          const discount = Number(item.discountAmount);
          return sum + price - discount;
        }, 0);
        return {
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          closedAt: o.closedAt,
          items: o.items.map((i) => ({
            productName: i.product.name,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
          })),
          total,
        };
      });
      return {
        id: c.id,
        phone: c.phone,
        name: c.name,
        email: c.email,
        notes: c.notes,
        visitCount: c.visitCount,
        lastVisit: c.lastVisit,
        createdAt: c.createdAt,
        recentOrders: ordersWithTotal,
      };
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "BĹ‚Ä…d wyszukiwania klientĂłw" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data, error: valError } = await parseBody(request, createCustomerSchema);
    if (valError) return valError;
    const { phone, name, email } = data;
    const notes = (data as Record<string, unknown>).notes as string | undefined;

    const existing = await prisma.customer.findUnique({
      where: { phone: phone.trim() },
      include: {
        orders: {
          where: { status: "CLOSED" },
          orderBy: { closedAt: "desc" },
          take: 5,
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
    if (existing) {
      const ordersWithTotal = existing.orders.map((o) => {
        const total = o.items.reduce((sum, item) => {
          const price = Number(item.unitPrice) * Number(item.quantity);
          const discount = Number(item.discountAmount);
          return sum + price - discount;
        }, 0);
        return {
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          closedAt: o.closedAt,
          items: o.items.map((i) => ({
            productName: i.product.name,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
          })),
          total,
        };
      });
      return NextResponse.json({
        id: existing.id,
        phone: existing.phone,
        name: existing.name,
        email: existing.email,
        notes: existing.notes,
        visitCount: existing.visitCount,
        lastVisit: existing.lastVisit,
        createdAt: existing.createdAt,
        recentOrders: ordersWithTotal,
      });
    }

    const customer = await prisma.customer.create({
      data: {
        phone: phone.trim(),
        name: name?.trim() ?? null,
        email: email?.trim() ?? null,
        notes: notes?.trim() ?? null,
      },
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
      recentOrders: [],
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "BĹ‚Ä…d tworzenia klienta" },
      { status: 500 }
    );
  }
}
