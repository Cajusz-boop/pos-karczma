export const dynamic = 'force-dynamic';

﻿import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { z } from "zod";
import { parseBody } from "@/lib/validation";


const cashOperationSchema = z.object({
  type: z.enum(["DEPOSIT", "WITHDRAWAL"]),
  amount: z.number().positive("Kwota musi byÄ‡ > 0"),
  reason: z.string().min(1, "Wymagany powĂłd operacji").max(200),
});

/**
 * GET /api/cash-drawer â€” current cash drawer state + recent operations
 */
export async function GET(request: NextRequest) {
  try {
    const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "20");

    // Get or create cash drawer
    let drawer = await prisma.cashDrawer.findFirst();
    if (!drawer) {
      drawer = await prisma.cashDrawer.create({
        data: { currentAmount: 0 },
      });
    }

    // Recent operations
    const operations = await prisma.cashOperation.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      drawer: {
        id: drawer.id,
        currentAmount: Number(drawer.currentAmount),
        lastOpenedAt: drawer.lastOpenedAt?.toISOString() ?? null,
        lastCountedAt: drawer.lastCountedAt?.toISOString() ?? null,
      },
      operations: operations.map((op) => ({
        id: op.id,
        type: op.type,
        amount: Number(op.amount),
        reason: op.reason,
        userName: op.user.name,
        userId: op.userId,
        createdAt: op.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "BĹ‚Ä…d pobierania stanu kasy" }, { status: 500 });
  }
}

/**
 * POST /api/cash-drawer â€” cash operation (deposit/withdrawal)
 */
export async function POST(request: NextRequest) {
  try {
    const { data, error: valError } = await parseBody(request, cashOperationSchema);
    if (valError) return valError;

    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    // Get or create cash drawer
    let drawer = await prisma.cashDrawer.findFirst();
    if (!drawer) {
      drawer = await prisma.cashDrawer.create({
        data: { currentAmount: 0 },
      });
    }

    const currentAmount = Number(drawer.currentAmount);
    const delta = data.type === "DEPOSIT" ? data.amount : -data.amount;
    const newAmount = currentAmount + delta;

    if (newAmount < 0) {
      return NextResponse.json(
        { error: `NiewystarczajÄ…ce Ĺ›rodki w kasie. Aktualnie: ${currentAmount.toFixed(2)} zĹ‚` },
        { status: 400 }
      );
    }

    // Create operation and update drawer in transaction
    const [operation] = await prisma.$transaction([
      prisma.cashOperation.create({
        data: {
          type: data.type,
          amount: data.amount,
          reason: data.reason,
          userId,
        },
        include: { user: { select: { name: true } } },
      }),
      prisma.cashDrawer.update({
        where: { id: drawer.id },
        data: { currentAmount: newAmount },
      }),
    ]);

    await auditLog(userId, `CASH_${data.type}`, "CashOperation", operation.id, {
      previousAmount: currentAmount,
    }, {
      type: data.type,
      amount: data.amount,
      reason: data.reason,
      newAmount,
    });

    return NextResponse.json({
      operation: {
        id: operation.id,
        type: operation.type,
        amount: Number(operation.amount),
        reason: operation.reason,
        userName: operation.user.name,
        createdAt: operation.createdAt.toISOString(),
      },
      drawer: {
        currentAmount: newAmount,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "BĹ‚Ä…d operacji kasowej" }, { status: 500 });
  }
}

/**
 * PATCH /api/cash-drawer â€” open drawer / update state
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body as { action?: string };

    let drawer = await prisma.cashDrawer.findFirst();
    if (!drawer) {
      drawer = await prisma.cashDrawer.create({
        data: { currentAmount: 0 },
      });
    }

    if (action === "open") {
      await prisma.cashDrawer.update({
        where: { id: drawer.id },
        data: { lastOpenedAt: new Date() },
      });

      const userId = request.headers.get("x-user-id");
      await auditLog(userId, "CASH_DRAWER_OPEN", "CashDrawer", drawer.id);

      return NextResponse.json({ ok: true, lastOpenedAt: new Date().toISOString() });
    }

    if (action === "count") {
      await prisma.cashDrawer.update({
        where: { id: drawer.id },
        data: { lastCountedAt: new Date() },
      });

      return NextResponse.json({ ok: true, lastCountedAt: new Date().toISOString() });
    }

    return NextResponse.json({ error: "Nieznana akcja" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "BĹ‚Ä…d operacji na szufladzie" }, { status: 500 });
  }
}
