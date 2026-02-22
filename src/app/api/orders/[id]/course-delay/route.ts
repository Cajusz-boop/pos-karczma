import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const courseDelaySchema = z.object({
  courseNumber: z.number().int().min(1).max(10),
  delayMinutes: z.number().int().min(1).max(120),
});

/**
 * POST /api/orders/[id]/course-delay - set delay for entire course
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const parsed = courseDelaySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { courseNumber, delayMinutes } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderNumber: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 404 });
    }

    const fireAt = new Date(Date.now() + delayMinutes * 60 * 1000);

    const result = await prisma.orderItem.updateMany({
      where: {
        orderId,
        courseNumber,
        status: { in: ["ORDERED", "SENT"] },
      },
      data: {
        delayMinutes,
        fireAt,
        isFire: false,
        firedAt: null,
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "ORDER_COURSE_DELAY_SET", "Order", orderId, undefined, {
      courseNumber,
      delayMinutes,
      fireAt: fireAt.toISOString(),
      itemsUpdated: result.count,
    });

    return NextResponse.json({
      message: `Minutnik ustawiony dla ${result.count} pozycji w daniu ${courseNumber}`,
      courseNumber,
      delayMinutes,
      fireAt: fireAt.toISOString(),
      itemsUpdated: result.count,
    });
  } catch (e) {
    console.error("[CourseDelay POST]", e);
    return NextResponse.json({ error: "Błąd ustawienia minutnika dla dania" }, { status: 500 });
  }
}

/**
 * DELETE /api/orders/[id]/course-delay - remove delay for course
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const { searchParams } = new URL(request.url);
    const courseNumber = parseInt(searchParams.get("courseNumber") ?? "0");

    if (!courseNumber) {
      return NextResponse.json({ error: "Wymagany numer dania" }, { status: 400 });
    }

    const result = await prisma.orderItem.updateMany({
      where: {
        orderId,
        courseNumber,
      },
      data: {
        delayMinutes: null,
        fireAt: null,
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "ORDER_COURSE_DELAY_CLEARED", "Order", orderId, undefined, {
      courseNumber,
      itemsUpdated: result.count,
    });

    return NextResponse.json({
      message: `Minutnik usunięty dla ${result.count} pozycji w daniu ${courseNumber}`,
      itemsUpdated: result.count,
    });
  } catch (e) {
    console.error("[CourseDelay DELETE]", e);
    return NextResponse.json({ error: "Błąd usuwania minutnika" }, { status: 500 });
  }
}
