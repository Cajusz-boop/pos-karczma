import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const createSwapSchema = z.object({
  requesterId: z.string().min(1),
  targetId: z.string().min(1),
  date: z.string().min(1),
  reason: z.string().optional(),
});

const respondSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["ACCEPTED", "REJECTED", "CANCELLED"]),
});

/**
 * GET /api/schedule/swap — list swap requests
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (userId) {
      where.OR = [{ requesterId: userId }, { targetId: userId }];
    }
    if (status) {
      where.status = status;
    }

    const swaps = await prisma.shiftSwapRequest.findMany({
      where,
      include: {
        requester: { select: { id: true, name: true } },
        target: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      swaps: swaps.map((s) => ({
        id: s.id,
        requester: s.requester,
        target: s.target,
        date: s.date.toISOString().slice(0, 10),
        status: s.status,
        reason: s.reason,
        respondedAt: s.respondedAt?.toISOString() ?? null,
        createdAt: s.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error("[Swap GET]", e);
    return NextResponse.json({ error: "Błąd pobierania zamian" }, { status: 500 });
  }
}

/**
 * POST /api/schedule/swap — create a swap request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createSwapSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    const { requesterId, targetId, date, reason } = parsed.data;

    if (requesterId === targetId) {
      return NextResponse.json({ error: "Nie można zamienić zmiany z samym sobą" }, { status: 400 });
    }

    const swap = await prisma.shiftSwapRequest.create({
      data: {
        requesterId,
        targetId,
        date: new Date(date),
        reason: reason ?? null,
      },
    });

    return NextResponse.json({ swap }, { status: 201 });
  } catch (e) {
    console.error("[Swap POST]", e);
    return NextResponse.json({ error: "Błąd tworzenia zamiany" }, { status: 500 });
  }
}

/**
 * PATCH /api/schedule/swap — respond to a swap request
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = respondSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    const { id, status } = parsed.data;

    const swap = await prisma.shiftSwapRequest.update({
      where: { id },
      data: {
        status,
        respondedAt: new Date(),
      },
      include: {
        requester: { select: { name: true } },
        target: { select: { name: true } },
      },
    });

    // If accepted, swap the schedules
    if (status === "ACCEPTED") {
      const date = swap.date;
      const requesterSchedule = await prisma.workSchedule.findUnique({
        where: { userId_date: { userId: swap.requesterId, date } },
      });
      const targetSchedule = await prisma.workSchedule.findUnique({
        where: { userId_date: { userId: swap.targetId, date } },
      });

      if (requesterSchedule && targetSchedule) {
        await prisma.$transaction([
          prisma.workSchedule.update({
            where: { id: requesterSchedule.id },
            data: {
              shiftStart: targetSchedule.shiftStart,
              shiftEnd: targetSchedule.shiftEnd,
              role: targetSchedule.role,
            },
          }),
          prisma.workSchedule.update({
            where: { id: targetSchedule.id },
            data: {
              shiftStart: requesterSchedule.shiftStart,
              shiftEnd: requesterSchedule.shiftEnd,
              role: requesterSchedule.role,
            },
          }),
        ]);
      }

      const userId = request.headers.get("x-user-id");
      await auditLog(userId, "SHIFT_SWAP_ACCEPTED", "ShiftSwapRequest", id, undefined, {
        requester: swap.requester.name,
        target: swap.target.name,
        date: date.toISOString().slice(0, 10),
      });
    }

    return NextResponse.json({ swap });
  } catch (e) {
    console.error("[Swap PATCH]", e);
    return NextResponse.json({ error: "Błąd odpowiedzi na zamianę" }, { status: 500 });
  }
}
