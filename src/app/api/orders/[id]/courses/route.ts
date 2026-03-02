export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const moveItemSchema = z.object({
  itemId: z.string().min(1),
  toCourse: z.number().int().min(1).max(9),
});

/**
 * GET /api/orders/[id]/courses - get order items grouped by course number
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          where: { status: { not: "CANCELLED" } },
          include: {
            product: { select: { name: true, nameShort: true } },
          },
          orderBy: [{ courseNumber: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 404 });
    }

    const courses: Record<number, typeof order.items> = {};
    for (const item of order.items) {
      const course = item.courseNumber;
      if (!courses[course]) {
        courses[course] = [];
      }
      courses[course].push(item);
    }

    const courseNumbers = Object.keys(courses).map(Number).sort((a, b) => a - b);

    const courseSummaries = courseNumbers.map((num) => {
      const items = courses[num];
      const total = items.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice) - Number(item.discountAmount),
        0
      );
      const allSent = items.every((i) => i.sentToKitchenAt);
      const allReady = items.every((i) => i.status === "READY" || i.status === "SERVED");
      const anyInProgress = items.some((i) => i.status === "IN_PROGRESS");

      return {
        courseNumber: num,
        itemCount: items.length,
        total,
        status: allReady ? "ready" : anyInProgress ? "in_progress" : allSent ? "sent" : "pending",
        items: items.map((item) => ({
          id: item.id,
          productName: item.product.name,
          productNameShort: item.product.nameShort,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          status: item.status,
          note: item.note,
          isFire: item.isFire,
          delayMinutes: item.delayMinutes,
        })),
      };
    });

    return NextResponse.json({
      orderId: order.id,
      courseReleasedUpTo: order.courseReleasedUpTo,
      courses: courseSummaries,
      maxCourse: Math.max(...courseNumbers, 1),
    });
  } catch (e) {
    console.error("[OrderCourses GET]", e);
    return NextResponse.json({ error: "Błąd pobierania kursów" }, { status: 500 });
  }
}

/**
 * PATCH /api/orders/[id]/courses - move item to different course
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = moveItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { itemId, toCourse } = parsed.data;

    const item = await prisma.orderItem.findUnique({
      where: { id: itemId, orderId: id },
      select: { id: true, courseNumber: true, sentToKitchenAt: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Pozycja nie istnieje" }, { status: 404 });
    }

    await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        courseNumber: toCourse,
        isModifiedAfterSend: item.sentToKitchenAt ? true : undefined,
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "ITEM_COURSE_CHANGED", "OrderItem", itemId, undefined, {
      fromCourse: item.courseNumber,
      toCourse,
    });

    return NextResponse.json({
      message: `Pozycja przeniesiona do kursu ${toCourse}`,
      itemId,
      newCourse: toCourse,
    });
  } catch (e) {
    console.error("[OrderCourses PATCH]", e);
    return NextResponse.json({ error: "Błąd przenoszenia pozycji" }, { status: 500 });
  }
}

/**
 * POST /api/orders/[id]/courses - create new course and optionally move items
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { itemIds } = body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          where: { status: { not: "CANCELLED" } },
          select: { courseNumber: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 404 });
    }

    const maxCourse = Math.max(...order.items.map((i) => i.courseNumber), 0);
    const newCourse = maxCourse + 1;

    if (itemIds && Array.isArray(itemIds) && itemIds.length > 0) {
      await prisma.orderItem.updateMany({
        where: { id: { in: itemIds }, orderId: id },
        data: { courseNumber: newCourse },
      });
    }

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "COURSE_CREATED", "Order", id, undefined, {
      newCourse,
      movedItems: itemIds?.length ?? 0,
    });

    return NextResponse.json({
      message: `Utworzono kurs ${newCourse}`,
      newCourse,
      movedItems: itemIds?.length ?? 0,
    }, { status: 201 });
  } catch (e) {
    console.error("[OrderCourses POST]", e);
    return NextResponse.json({ error: "Błąd tworzenia kursu" }, { status: 500 });
  }
}
