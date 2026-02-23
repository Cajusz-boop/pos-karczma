import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = process.env.CAPACITOR_BUILD === "1" ? "force-static" : "force-dynamic";
export const runtime = "nodejs";

/**
 * SSE endpoint for real-time KDS order updates.
 * Replaces polling with push-based updates for kitchen displays.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stationId: string }> }
) {
  if (process.env.CAPACITOR_BUILD === "1") {
    return new Response(JSON.stringify({ error: "SSE not available in static build" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  const { stationId } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (eventType: string, data: unknown) => {
        const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
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
          const station = await prisma.kDSStation.findUnique({
            where: { id: stationId },
            include: {
              categories: { select: { categoryId: true } },
            },
          });

          if (!station) {
            sendEvent("error", { message: "Station not found" });
            return;
          }

          const categoryIds = station.categories.map((c) => c.categoryId);

          const orders = await prisma.order.findMany({
            where: {
              status: { in: ["SENT_TO_KITCHEN", "IN_PROGRESS", "READY"] },
              items: {
                some: {
                  status: { in: ["SENT", "IN_PROGRESS", "READY"] },
                  product: { categoryId: { in: categoryIds } },
                },
              },
            },
            include: {
              user: { select: { name: true } },
              table: { select: { number: true } },
              banquetEvent: {
                include: { reservation: { select: { guestName: true } } },
              },
              items: {
                where: {
                  status: { in: ["SENT", "IN_PROGRESS", "READY"] },
                  product: { categoryId: { in: categoryIds } },
                },
                include: {
                  product: { select: { name: true, categoryId: true } },
                },
                orderBy: { createdAt: "asc" },
              },
            },
            orderBy: { createdAt: "asc" },
          });

          const active = orders
            .filter((o) => o.items.some((i) => i.status !== "READY"))
            .map((o) => ({
              orderId: o.id,
              orderNumber: o.orderNumber,
              tableNumber: o.table?.number ?? null,
              type: o.type,
              courseReleasedUpTo: o.courseReleasedUpTo,
              waiterName: o.user.name,
              guestCount: o.guestCount,
              banquetName: o.banquetEvent?.reservation?.guestName ?? null,
              sentAt: o.items[0]?.sentToKitchenAt?.toISOString() ?? null,
              items: o.items.map((i) => ({
                id: i.id,
                productName: i.product.name,
                quantity: Number(i.quantity),
                note: i.note,
                modifiersJson: i.modifiersJson,
                courseNumber: i.courseNumber,
                status: i.status,
                isModifiedAfterSend: i.isModifiedAfterSend,
                cancelReason: i.cancelReason,
              })),
            }));

          const served = orders
            .filter((o) => o.items.every((i) => i.status === "READY"))
            .slice(0, 10)
            .map((o) => ({
              orderId: o.id,
              orderNumber: o.orderNumber,
              tableNumber: o.table?.number ?? null,
              type: o.type,
              waiterName: o.user.name,
              servedAt: o.items[0]?.readyAt?.toISOString() ?? new Date().toISOString(),
              items: o.items.map((i) => i.product.name),
            }));

          const result = { active, served };
          const dataHash = JSON.stringify(result);

          if (dataHash !== lastDataHash) {
            lastDataHash = dataHash;
            sendEvent("orders", { ...result, timestamp: new Date().toISOString() });
          }
        } catch (e) {
          console.error("[SSE KDS]", e);
          sendEvent("error", { message: "Database error" });
        }
      };

      await fetchAndSend();

      const interval = setInterval(async () => {
        if (isAborted) {
          clearInterval(interval);
          return;
        }
        await fetchAndSend();
      }, 2000);

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
