import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/customer-display/[id]/orders - get orders for customer display
 * 
 * Returns orders that are:
 * - Being prepared (status = IN_PROGRESS or items in progress)
 * - Ready for pickup (status = READY or all items ready)
 */
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export async function generateStaticParams() {
  return [ {"id":"_"} ];
}


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const display = await prisma.customerDisplay.findUnique({
      where: { id },
    });

    if (!display) {
      return NextResponse.json({ error: "Ekran nie istnieje" }, { status: 404 });
    }

    if (!display.isActive) {
      return NextResponse.json({ error: "Ekran jest nieaktywny" }, { status: 400 });
    }

    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 4);

    const orders = await prisma.order.findMany({
      where: {
        type: { in: ["TAKEAWAY", "PHONE"] },
        status: { in: ["OPEN", "IN_PROGRESS", "SENT_TO_KITCHEN"] },
        createdAt: { gte: cutoffTime },
      },
      include: {
        items: {
          where: { status: { not: "CANCELLED" } },
          select: { status: true, readyAt: true },
        },
      },
      orderBy: { createdAt: "asc" },
      take: display.maxOrders * 2,
    });

    const preparing: Array<{ orderNumber: number; customerName?: string }> = [];
    const ready: Array<{ orderNumber: number; customerName?: string; readyAt: Date }> = [];

    const readyCutoff = new Date();
    readyCutoff.setSeconds(readyCutoff.getSeconds() - display.readyTimeoutSec);

    for (const order of orders) {
      const allReady = order.items.length > 0 && order.items.every((i) => i.status === "READY" || i.status === "SERVED");
      const anyInProgress = order.items.some((i) => i.status === "IN_PROGRESS");
      const latestReadyAt = order.items
        .filter((i) => i.readyAt)
        .map((i) => i.readyAt!)
        .sort((a, b) => b.getTime() - a.getTime())[0];

      if (allReady && latestReadyAt) {
        if (latestReadyAt > readyCutoff) {
          ready.push({
            orderNumber: order.orderNumber,
            customerName: order.deliveryPhone ? `Tel: ${order.deliveryPhone.slice(-4)}` : undefined,
            readyAt: latestReadyAt,
          });
        }
      } else if (anyInProgress || order.items.some((i) => i.status === "SENT")) {
        preparing.push({
          orderNumber: order.orderNumber,
          customerName: order.deliveryPhone ? `Tel: ${order.deliveryPhone.slice(-4)}` : undefined,
        });
      }
    }

    preparing.sort((a, b) => a.orderNumber - b.orderNumber);
    ready.sort((a, b) => b.readyAt.getTime() - a.readyAt.getTime());

    return NextResponse.json({
      display: {
        name: display.name,
        backgroundColor: display.backgroundColor,
        textColor: display.textColor,
        accentColor: display.accentColor,
        fontSize: display.fontSize,
        showLogo: display.showLogo,
        logoUrl: display.logoUrl,
        soundOnReady: display.soundOnReady,
        soundUrl: display.soundUrl,
        showPreparingSection: display.showPreparingSection,
        showReadySection: display.showReadySection,
      },
      preparing: display.showPreparingSection ? preparing.slice(0, display.maxOrders) : [],
      ready: display.showReadySection ? ready.slice(0, display.maxOrders) : [],
      timestamp: new Date(),
    });
  } catch (e) {
    console.error("[CustomerDisplayOrders GET]", e);
    return NextResponse.json({ error: "Błąd pobierania zamówień" }, { status: 500 });
  }
}
