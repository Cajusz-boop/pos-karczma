import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = process.env.CAPACITOR_BUILD === "1" ? "force-static" : "force-dynamic";
export const runtime = "nodejs";

/**
 * SSE endpoint for real-time floor updates.
 * Replaces polling with push-based updates.
 * 
 * Usage: const eventSource = new EventSource('/api/pos/floor/stream');
 */
export async function GET(request: NextRequest) {
  if (process.env.CAPACITOR_BUILD === "1") {
    return new Response(JSON.stringify({ error: "SSE not available in static build" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: unknown) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      const sendKeepAlive = () => {
        controller.enqueue(encoder.encode(": keepalive\n\n"));
      };

      let lastDataHash = "";
      let isAborted = false;

      request.signal.addEventListener("abort", () => {
        isAborted = true;
      });

      const fetchAndSend = async () => {
        if (isAborted) return;
        
        try {
          const now = new Date();
          const today = new Date(now.toISOString().slice(0, 10));
          
          const rooms = await prisma.room.findMany({
            where: { isActive: true },
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
                  needsAttention: true,
                  orders: {
                    where: { status: { notIn: ["CLOSED", "CANCELLED"] } },
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
                        select: { status: true, readyAt: true },
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
                let minutesSinceLastKitchenEvent: number | null = null;
                if (order.items?.length) {
                  const readyTimes = order.items
                    .filter((i) => i.readyAt)
                    .map((i) => new Date(i.readyAt!).getTime());
                  if (readyTimes.length) {
                    const lastKitchen = Math.max(...readyTimes);
                    minutesSinceLastKitchenEvent = Math.floor((now.getTime() - lastKitchen) / 60000);
                  }
                }
                timing = {
                  minutesSinceCreated: Math.floor((now.getTime() - createdAt.getTime()) / 60000),
                  minutesSinceLastInteraction: Math.floor((now.getTime() - lastInteraction.getTime()) / 60000),
                  minutesSinceLastKitchenEvent,
                };
              }

              let nextReservation = null;
              if (reservation) {
                const resTime = new Date(reservation.timeFrom);
                nextReservation = {
                  id: reservation.id,
                  timeFrom: resTime.toTimeString().slice(0, 5),
                  guestName: reservation.guestName,
                  guestCount: reservation.guestCount,
                  minutesUntil: Math.floor((resTime.getTime() - now.getTime()) / 60000),
                  isVip: false,
                };
              }

              let assignedUserName = null;
              let assignedUserInitials = null;
              if (order?.user?.name) {
                assignedUserName = order.user.name;
                const parts = order.user.name.split(" ");
                assignedUserInitials = parts.map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
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
                activeOrder: order ? {
                  id: order.id,
                  orderNumber: order.orderNumber,
                  createdAt: order.createdAt.toISOString(),
                  totalGross: Number(order.totalGross),
                  itemCount: order.itemCount,
                  guestCount: order.guestCount,
                  userId: order.userId,
                  userName: order.user?.name ?? "",
                } : null,
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
              tables,
              stats: { total: tables.length, free, occupied, billRequested, reserved, withAlerts, totalRevenue },
            };
          });

          const dataHash = JSON.stringify(result);
          
          if (dataHash !== lastDataHash) {
            lastDataHash = dataHash;
            sendEvent({ type: "floor", rooms: result, timestamp: now.toISOString() });
          }
        } catch (e) {
          console.error("[SSE Floor]", e);
          sendEvent({ type: "error", message: "Database error" });
        }
      };

      await fetchAndSend();

      const interval = setInterval(async () => {
        if (isAborted) {
          clearInterval(interval);
          return;
        }
        await fetchAndSend();
      }, 3000);

      const keepAliveInterval = setInterval(() => {
        if (isAborted) {
          clearInterval(keepAliveInterval);
          return;
        }
        sendKeepAlive();
      }, 15000);

      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        clearInterval(keepAliveInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
