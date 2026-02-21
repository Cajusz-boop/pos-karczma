import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Alert {
  id: string;
  type: string;
  tableId: string;
  tableNumber: number;
  roomId: string;
  message: string;
  createdAt: Date;
  priority: number;
  orderId?: string;
}

/**
 * Endpoint alertów POS - zwraca listę alertów wymagających reakcji kelnera.
 * Typy alertów:
 * - KITCHEN_READY: dania gotowe do odebrania (priority 1)
 * - RESERVATION_CONFLICT: stolik zajęty + rezerwacja za <30 min (priority 2)
 * - BILL_REQUESTED: goście proszą o rachunek (priority 3)
 * - LONG_WAIT: stolik czeka >30 min bez interakcji (priority 4)
 * - NEEDS_ATTENTION: kelner ręcznie oznaczył (priority 5)
 */
export async function GET(request: NextRequest) {
  const start = performance.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const roomId = searchParams.get("roomId");
    
    const now = new Date();
    const today = new Date(now.toISOString().slice(0, 10));
    const alerts: Alert[] = [];
    
    // 1. KITCHEN_READY - dania gotowe do odebrania
    const readyItems = await prisma.orderItem.findMany({
      where: {
        status: "READY",
        order: {
          status: { notIn: ["CLOSED", "CANCELLED"] },
          ...(userId && { userId }),
        },
      },
      select: {
        id: true,
        readyAt: true,
        order: {
          select: {
            id: true,
            table: {
              select: { id: true, number: true, roomId: true },
            },
          },
        },
      },
    });
    
    const readyByTable = new Map<string, { count: number; oldest: Date; orderId: string }>();
    for (const item of readyItems) {
      if (!item.order.table) continue;
      const tableId = item.order.table.id;
      const existing = readyByTable.get(tableId);
      const readyAt = item.readyAt ?? now;
      if (!existing) {
        readyByTable.set(tableId, { count: 1, oldest: readyAt, orderId: item.order.id });
      } else {
        existing.count++;
        if (readyAt < existing.oldest) existing.oldest = readyAt;
      }
    }
    
    const seenKitchenTables = new Set<string>();
    for (const item of readyItems) {
      if (!item.order.table) continue;
      const table = item.order.table;
      if (seenKitchenTables.has(table.id)) continue;
      seenKitchenTables.add(table.id);
      
      const data = readyByTable.get(table.id)!;
      const mins = Math.floor((now.getTime() - data.oldest.getTime()) / 60000);
      
      alerts.push({
        id: `kitchen-${table.id}`,
        type: "KITCHEN_READY",
        tableId: table.id,
        tableNumber: table.number,
        roomId: table.roomId,
        message: `Stolik ${table.number} — ${data.count} ${data.count === 1 ? "danie gotowe" : "dania gotowe"} (${mins} min)`,
        createdAt: data.oldest,
        priority: 1,
        orderId: data.orderId,
      });
    }
    
    // 2. BILL_REQUESTED - stoliki czekające na rachunek
    const billTables = await prisma.table.findMany({
      where: {
        status: "BILL_REQUESTED",
        ...(roomId && { roomId }),
      },
      select: {
        id: true,
        number: true,
        roomId: true,
        orders: {
          where: { status: { notIn: ["CLOSED", "CANCELLED"] } },
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { id: true, lastInteractionAt: true },
        },
      },
    });
    
    for (const table of billTables) {
      const order = table.orders[0];
      const lastChange = order?.lastInteractionAt ?? now;
      const mins = Math.floor((now.getTime() - lastChange.getTime()) / 60000);
      
      alerts.push({
        id: `bill-${table.id}`,
        type: "BILL_REQUESTED",
        tableId: table.id,
        tableNumber: table.number,
        roomId: table.roomId,
        message: `Stolik ${table.number} — rachunek (${mins} min)`,
        createdAt: lastChange,
        priority: 3,
        orderId: order?.id,
      });
    }
    
    // 3. RESERVATION_CONFLICT - stolik zajęty + rezerwacja za <30 min
    const occupiedWithReservation = await prisma.table.findMany({
      where: {
        status: "OCCUPIED",
        reservations: {
          some: {
            date: today,
            status: { in: ["PENDING", "CONFIRMED"] },
            timeFrom: {
              lte: new Date(now.getTime() + 30 * 60 * 1000),
              gte: now,
            },
          },
        },
      },
      select: {
        id: true,
        number: true,
        roomId: true,
        reservations: {
          where: {
            date: today,
            status: { in: ["PENDING", "CONFIRMED"] },
          },
          take: 1,
          orderBy: { timeFrom: "asc" },
          select: { timeFrom: true, guestName: true, guestCount: true },
        },
      },
    });
    
    for (const table of occupiedWithReservation) {
      const res = table.reservations[0];
      if (!res) continue;
      const mins = Math.floor((res.timeFrom.getTime() - now.getTime()) / 60000);
      
      alerts.push({
        id: `conflict-${table.id}`,
        type: "RESERVATION_CONFLICT",
        tableId: table.id,
        tableNumber: table.number,
        roomId: table.roomId,
        message: `⚠️ Stolik ${table.number} zajęty — rez. ${res.guestName} (${res.guestCount} os.) za ${mins} min!`,
        createdAt: now,
        priority: 2,
      });
    }
    
    // 4. LONG_WAIT - stoliki czekające >30 min bez interakcji
    const longWaitOrders = await prisma.order.findMany({
      where: {
        status: { notIn: ["CLOSED", "CANCELLED"] },
        tableId: { not: null },
        lastInteractionAt: {
          lt: new Date(now.getTime() - 30 * 60 * 1000),
        },
        ...(userId && { userId }),
      },
      select: {
        id: true,
        lastInteractionAt: true,
        table: {
          select: { id: true, number: true, roomId: true },
        },
      },
    });
    
    for (const order of longWaitOrders) {
      if (!order.table) continue;
      const mins = Math.floor((now.getTime() - order.lastInteractionAt.getTime()) / 60000);
      
      alerts.push({
        id: `longwait-${order.table.id}`,
        type: "LONG_WAIT",
        tableId: order.table.id,
        tableNumber: order.table.number,
        roomId: order.table.roomId,
        message: `Stolik ${order.table.number} — brak interakcji ${mins} min`,
        createdAt: order.lastInteractionAt,
        priority: 4,
        orderId: order.id,
      });
    }
    
    // 5. NEEDS_ATTENTION - ręczna flaga kelnera
    const attentionTables = await prisma.table.findMany({
      where: {
        needsAttention: true,
        ...(roomId && { roomId }),
      },
      select: {
        id: true,
        number: true,
        roomId: true,
      },
    });
    
    for (const table of attentionTables) {
      alerts.push({
        id: `attention-${table.id}`,
        type: "NEEDS_ATTENTION",
        tableId: table.id,
        tableNumber: table.number,
        roomId: table.roomId,
        message: `Stolik ${table.number} — wymaga uwagi`,
        createdAt: now,
        priority: 5,
      });
    }
    
    // Sortuj po priorytecie, potem po czasie (najstarsze pierwsze)
    alerts.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
    
    const elapsed = Math.round(performance.now() - start);
    
    return NextResponse.json({
      alerts,
      meta: {
        timestamp: now.toISOString(),
        queryTimeMs: elapsed,
        count: alerts.length,
      },
    });
  } catch (e) {
    console.error("[Alerts API]", e);
    return NextResponse.json({ error: "Błąd alertów" }, { status: 500 });
  }
}

/**
 * POST - dismiss alert (np. oznacz danie jako odebrane)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, action } = body;
    
    if (!alertId || !action) {
      return NextResponse.json(
        { error: "Wymagane: alertId, action" },
        { status: 400 }
      );
    }
    
    // Parse alert ID
    const [type, tableId] = alertId.split("-");
    
    if (action === "dismiss") {
      if (type === "attention") {
        await prisma.table.update({
          where: { id: tableId },
          data: { needsAttention: false },
        });
      }
      // Inne typy alertów są dismissowane przez zmianę statusu (np. odebranie dania)
    }
    
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[Alerts POST]", e);
    return NextResponse.json({ error: "Błąd" }, { status: 500 });
  }
}
