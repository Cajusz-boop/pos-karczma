export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { onTableEvent } from "@/lib/sse/event-bus";

/**
 * GET /api/public/table/[qrId]/sse
 * Server-Sent Events stream dla real-time aktualizacji rachunku.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ qrId: string }> }
) {
  const { qrId } = await params;

  const table = await prisma.table.findUnique({
    where: { qrId },
  });

  if (!table) {
    return new Response("Not Found", { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const handler = (event: { type: string; payload: unknown }) => {
        try {
          controller.enqueue(
            encoder.encode(
              `event: ${event.type}\ndata: ${JSON.stringify(event.payload)}\n\n`
            )
          );
        } catch {
          // ignore
        }
      };

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      const unsubscribe = onTableEvent(qrId, handler);

      request.signal.addEventListener(
        "abort",
        () => {
          clearInterval(heartbeat);
          unsubscribe();
          controller.close();
        },
        { once: true }
      );
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
