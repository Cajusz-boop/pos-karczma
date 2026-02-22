import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const POINTS_PER_ZL = 1;

const lookupSchema = z.object({
  phone: z.string().min(1, "Wymagany numer telefonu"),
});

const earnSchema = z.object({
  customerId: z.string().min(1),
  orderId: z.string().min(1),
  amount: z.number().positive(),
});

const redeemSchema = z.object({
  customerId: z.string().min(1),
  rewardId: z.string().min(1),
  orderId: z.string().optional(),
});

const adjustSchema = z.object({
  customerId: z.string().min(1),
  points: z.number().int(),
  description: z.string().min(1),
});

/**
 * GET /api/loyalty?phone=xxx — lookup customer loyalty info
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    const customerId = searchParams.get("customerId");

    if (!phone && !customerId) {
      return NextResponse.json({ error: "Wymagany phone lub customerId" }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: phone ? { phone } : { id: customerId! },
      include: {
        loyaltyTransactions: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Klient nie znaleziony" }, { status: 404 });
    }

    const rewards = await prisma.loyaltyReward.findMany({
      where: { isActive: true },
      orderBy: { pointsCost: "asc" },
    });

    const availableRewards = rewards.filter((r) => r.pointsCost <= customer.loyaltyPoints);

    return NextResponse.json({
      customer: {
        id: customer.id,
        phone: customer.phone,
        name: customer.name,
        loyaltyPoints: customer.loyaltyPoints,
        totalSpent: Number(customer.totalSpent),
        visitCount: customer.visitCount,
      },
      transactions: customer.loyaltyTransactions,
      rewards,
      availableRewards,
    });
  } catch (e) {
    console.error("[Loyalty GET]", e);
    return NextResponse.json({ error: "Błąd programu lojalnościowego" }, { status: 500 });
  }
}

/**
 * POST /api/loyalty — earn points, redeem reward, or adjust
 * Body: { action: "earn" | "redeem" | "adjust", ... }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action as string;

    if (action === "earn") {
      const parsed = earnSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
      }
      const { customerId, orderId, amount } = parsed.data;

      const points = Math.floor(amount * POINTS_PER_ZL);
      if (points <= 0) {
        return NextResponse.json({ error: "Za mało do naliczenia punktów" }, { status: 400 });
      }

      const result = await prisma.$transaction(async (tx) => {
        const customer = await tx.customer.update({
          where: { id: customerId },
          data: {
            loyaltyPoints: { increment: points },
            totalSpent: { increment: amount },
            visitCount: { increment: 1 },
            lastVisit: new Date(),
          },
        });

        const tx2 = await tx.loyaltyTransaction.create({
          data: {
            customerId,
            points,
            type: "EARNED",
            orderId,
            description: `+${points} pkt za zamówienie ${amount.toFixed(2)} zł`,
          },
        });

        return { customer, transaction: tx2 };
      });

      return NextResponse.json({
        points: result.customer.loyaltyPoints,
        earned: points,
      });
    }

    if (action === "redeem") {
      const parsed = redeemSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
      }
      const { customerId, rewardId, orderId } = parsed.data;

      const reward = await prisma.loyaltyReward.findUnique({ where: { id: rewardId } });
      if (!reward || !reward.isActive) {
        return NextResponse.json({ error: "Nagroda nie istnieje lub jest nieaktywna" }, { status: 404 });
      }

      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!customer) {
        return NextResponse.json({ error: "Klient nie znaleziony" }, { status: 404 });
      }

      if (customer.loyaltyPoints < reward.pointsCost) {
        return NextResponse.json({
          error: `Za mało punktów (${customer.loyaltyPoints}/${reward.pointsCost})`,
        }, { status: 400 });
      }

      const result = await prisma.$transaction(async (tx) => {
        const updatedCustomer = await tx.customer.update({
          where: { id: customerId },
          data: { loyaltyPoints: { decrement: reward.pointsCost } },
        });

        const transaction = await tx.loyaltyTransaction.create({
          data: {
            customerId,
            points: -reward.pointsCost,
            type: "REDEEMED",
            orderId,
            description: `Nagroda: ${reward.name} (-${reward.pointsCost} pkt)`,
          },
        });

        return { customer: updatedCustomer, transaction };
      });

      const userId = request.headers.get("x-user-id");
      await auditLog(userId, "LOYALTY_REDEEMED", "Customer", customerId, undefined, {
        rewardId,
        rewardName: reward.name,
        pointsCost: reward.pointsCost,
        orderId,
      });

      return NextResponse.json({
        points: result.customer.loyaltyPoints,
        redeemed: reward.pointsCost,
        reward: {
          name: reward.name,
          type: reward.rewardType,
          value: Number(reward.rewardValue),
          productId: reward.productId,
        },
      });
    }

    if (action === "adjust") {
      const parsed = adjustSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
      }
      const { customerId, points, description } = parsed.data;

      const result = await prisma.$transaction(async (tx) => {
        const customer = await tx.customer.update({
          where: { id: customerId },
          data: { loyaltyPoints: { increment: points } },
        });

        const transaction = await tx.loyaltyTransaction.create({
          data: {
            customerId,
            points,
            type: "ADJUSTMENT",
            description,
          },
        });

        return { customer, transaction };
      });

      const userId = request.headers.get("x-user-id");
      await auditLog(userId, "LOYALTY_ADJUSTED", "Customer", customerId, undefined, {
        points,
        description,
      });

      return NextResponse.json({ points: result.customer.loyaltyPoints });
    }

    return NextResponse.json({ error: "Nieznana akcja" }, { status: 400 });
  } catch (e) {
    console.error("[Loyalty POST]", e);
    return NextResponse.json({ error: "Błąd programu lojalnościowego" }, { status: 500 });
  }
}
