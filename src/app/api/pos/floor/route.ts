export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export const revalidate = 0;

/**
 * Zoptymalizowany endpoint do pobierania mapy stolików.
 * Różnice vs /api/rooms:
 * - Nie wywołuje processNoShows (przeniesione do CRON)
 * - Używa cached totalGross/itemCount z Order (nie liczy w JS)
 * - Zwraca tylko niezbędne pola
 * - Dodaje metryki wydajności
 */
export async function GET(request: NextRequest) {
  const start = performance.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const userId = searchParams.get("userId");
    
    const now = new Date();
    const today = new Date(now.toISOString().slice(0, 10));
    
    const rooms = await prisma.room.findMany({
      where: {
        isActive: true,
        ...(roomId && { id: roomId }),
      },
      select: {
        id: true,
        name: true,
        capacity: true,
        type: true,
        tables: {
          orderBy: { number: "asc" },
          select: {
            id: true,
            number: true,
            seats: true,
            shape: true,
            status: true,
            positionX: true,
            positionY: true,
            assignedUser: true,
            needsAttention: true,
            orders: {
              where: {
                status: { notIn: ["CLOSED", "CANCELLED"] },
              },
              take: 1,
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                orderNumber: true,
                createdAt: true,
                guestCount: true,
                totalGross: true,
                itemCount: true,
                lastInteractionAt: true,
                userId: true,
                user: { select: { name: true } },
                items: {
                  select: {
                    status: true,
                    readyAt: true,
                  },
                },
              },
            },
            reservations: {
              where: {
                date: today,
                status: { in: ["PENDING", "CONFIRMED"] },
              },
              take: 1,
              orderBy: { timeFrom: "asc" },
              select: {
                id: true,
                timeFrom: true,
                guestName: true,
                guestCount: true,
                notes: true,
              },
            },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });
    
    const result = rooms.map((room) => {
      let free = 0, occupied = 0, billRequested = 0, reserved = 0, withAlerts = 0;
      let totalRevenue = 0;
      
      const tables = room.tables.map((t) => {
        const order = t.orders[0];
        const reservation = t.reservations[0];
        
        if (t.status === "FREE") free++;
        else if (t.status === "OCCUPIED") occupied++;
        else if (t.status === "BILL_REQUESTED") billRequested++;
        else if (t.status === "RESERVED") reserved++;
        
        let kitchenStatus = null;
        let hasKitchenAlert = false;
        
        if (order?.items?.length) {
          const counts = { ordered: 0, inProgress: 0, ready: 0, served: 0 };
          for (const item of order.items) {
            if (item.status === "ORDERED" || item.status === "SENT") counts.ordered++;
            else if (item.status === "IN_PROGRESS") counts.inProgress++;
            else if (item.status === "READY") counts.ready++;
            else if (item.status === "SERVED") counts.served++;
          }
          kitchenStatus = counts;
          hasKitchenAlert = counts.ready > 0;
          if (hasKitchenAlert) withAlerts++;
        }
        
        if (order) {
          totalRevenue += Number(order.totalGross);
        }
        
        let timing = null;
        if (order) {
          const createdAt = new Date(order.createdAt);
          const lastInteraction = new Date(order.lastInteractionAt);
          const lastKitchenEvent = order.items
            ?.filter((i) => i.readyAt)
            .map((i) => new Date(i.readyAt!))
            .sort((a, b) => b.getTime() - a.getTime())[0];
          
          timing = {
            minutesSinceCreated: Math.floor((now.getTime() - createdAt.getTime()) / 60000),
            minutesSinceLastInteraction: Math.floor((now.getTime() - lastInteraction.getTime()) / 60000),
            minutesSinceLastKitchenEvent: lastKitchenEvent
              ? Math.floor((now.getTime() - lastKitchenEvent.getTime()) / 60000)
              : null,
          };
        }
        
        let nextReservation = null;
        if (reservation) {
          const resTime = new Date(reservation.timeFrom);
          const minutesUntil = Math.floor((resTime.getTime() - now.getTime()) / 60000);
          nextReservation = {
            id: reservation.id,
            timeFrom: resTime.toTimeString().slice(0, 5),
            guestName: reservation.guestName,
            guestCount: reservation.guestCount,
            minutesUntil,
            isVip: reservation.notes?.toLowerCase().includes("vip") ?? false,
          };
        }
        
        let assignedUserName = null;
        let assignedUserInitials = null;
        if (order?.user?.name) {
          assignedUserName = order.user.name;
          const parts = order.user.name.split(" ");
          assignedUserInitials = parts.map((n) => n[0]).join("").toUpperCase().slice(0, 2);
        }
        
        return {
          id: t.id,
          number: t.number,
          seats: t.seats,
          shape: t.shape,
          status: t.status,
          positionX: t.positionX,
          positionY: t.positionY,
          assignedUserId: order?.userId ?? null,
          assignedUserName,
          assignedUserInitials,
          activeOrder: order
            ? {
                id: order.id,
                orderNumber: order.orderNumber,
                createdAt: order.createdAt,
                totalGross: Number(order.totalGross),
                itemCount: order.itemCount,
                guestCount: order.guestCount,
                userId: order.userId,
                userName: order.user.name,
              }
            : null,
          kitchenStatus,
          timing,
          nextReservation,
          needsAttention: t.needsAttention,
          hasKitchenAlert,
        };
      });
      
      return {
        id: room.id,
        name: room.name,
        capacity: room.capacity,
        type: room.type,
        tables,
        stats: {
          total: tables.length,
          free,
          occupied,
          billRequested,
          reserved,
          withAlerts,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
        },
      };
    });
    
    const elapsed = Math.round(performance.now() - start);
    
    return NextResponse.json({
      rooms: result,
      meta: {
        timestamp: now.toISOString(),
        queryTimeMs: elapsed,
      },
    });
  } catch (e) {
    console.error("[Floor API]", e);
    return NextResponse.json({ error: "Błąd pobierania mapy" }, { status: 500 });
  }
}

/**
 * PATCH - aktualizacja flagi needsAttention na stoliku
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableId, needsAttention } = body;
    
    if (!tableId || typeof needsAttention !== "boolean") {
      return NextResponse.json(
        { error: "Wymagane: tableId, needsAttention" },
        { status: 400 }
      );
    }
    
    const table = await prisma.table.update({
      where: { id: tableId },
      data: { needsAttention },
      select: { id: true, number: true, needsAttention: true },
    });
    
    return NextResponse.json({ table });
  } catch (e) {
    console.error("[Floor PATCH]", e);
    return NextResponse.json({ error: "Błąd aktualizacji" }, { status: 500 });
  }
}
