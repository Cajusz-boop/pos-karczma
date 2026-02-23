import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

/**
 * PATCH /api/orders/[id]/release-course
 * Fire timing: release the next course to the kitchen.
 * Body: { courseNumber: number }
 *
 * Flow:
 * 1. Course 1 is always released immediately when order is sent
 * 2. Waiter fires course 2 when appetizers are served
 * 3. Waiter fires course 3 when mains should start
 *
 * KDS only shows items where courseNumber <= courseReleasedUpTo
 */
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export async function generateStaticParams() {
  return [ {"id":"_"} ];
}


export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const { courseNumber } = body as { courseNumber: number };

    if (typeof courseNumber !== "number" || courseNumber < 1) {
      return NextResponse.json({ error: "Nieprawidłowy numer kursu" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: { courseNumber, status: { not: "CANCELLED" } },
          select: { id: true, productId: true },
        },
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 404 });
    }
    if (order.courseReleasedUpTo >= courseNumber) {
      return NextResponse.json({ ok: true, alreadyReleased: true });
    }

    // Update courseReleasedUpTo and mark items as SENT
    const now = new Date();
    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { courseReleasedUpTo: courseNumber },
      }),
      // Set sentToKitchenAt for items in this course that haven't been sent yet
      prisma.orderItem.updateMany({
        where: {
          orderId,
          courseNumber,
          status: "ORDERED",
          sentToKitchenAt: null,
        },
        data: {
          status: "SENT",
          sentToKitchenAt: now,
        },
      }),
    ]);

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "COURSE_FIRE", "Order", orderId, {
      previousCourse: order.courseReleasedUpTo,
    }, {
      courseNumber,
      itemCount: order.items.length,
    });

    return NextResponse.json({
      ok: true,
      courseNumber,
      itemsFired: order.items.length,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd wydawania kursu" }, { status: 500 });
  }
}
