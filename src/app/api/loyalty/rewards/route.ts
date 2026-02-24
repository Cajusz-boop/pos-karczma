import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { autoExportConfigSnapshot } from "@/lib/config-snapshot";

const createRewardSchema = z.object({
  name: z.string().min(1, "Wymagana nazwa nagrody"),
  pointsCost: z.number().int().positive("Koszt musi być > 0"),
  rewardType: z.enum(["FREE_PRODUCT", "DISCOUNT_PERCENT", "DISCOUNT_AMOUNT"]),
  rewardValue: z.number().min(0).optional(),
  productId: z.string().optional(),
});

/**
 * GET /api/loyalty/rewards — list all rewards
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rewards = await prisma.loyaltyReward.findMany({
      orderBy: { pointsCost: "asc" },
    });
    return NextResponse.json({ rewards });
  } catch (e) {
    console.error("[Loyalty Rewards GET]", e);
    return NextResponse.json({ error: "Błąd pobierania nagród" }, { status: 500 });
  }
}

/**
 * POST /api/loyalty/rewards — create a new reward
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createRewardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const reward = await prisma.loyaltyReward.create({
      data: {
        name: parsed.data.name,
        pointsCost: parsed.data.pointsCost,
        rewardType: parsed.data.rewardType,
        rewardValue: parsed.data.rewardValue ?? 0,
        productId: parsed.data.productId ?? null,
      },
    });

    autoExportConfigSnapshot();
    return NextResponse.json({ reward }, { status: 201 });
  } catch (e) {
    console.error("[Loyalty Rewards POST]", e);
    return NextResponse.json({ error: "Błąd tworzenia nagrody" }, { status: 500 });
  }
}

/**
 * PATCH /api/loyalty/rewards — update a reward
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body as { id?: string; [key: string]: unknown };

    if (!id) {
      return NextResponse.json({ error: "Wymagane id nagrody" }, { status: 400 });
    }

    const reward = await prisma.loyaltyReward.update({
      where: { id },
      data: {
        ...(typeof data.name === "string" && { name: data.name }),
        ...(typeof data.pointsCost === "number" && { pointsCost: data.pointsCost }),
        ...(typeof data.isActive === "boolean" && { isActive: data.isActive }),
        ...(typeof data.rewardValue === "number" && { rewardValue: data.rewardValue }),
      },
    });

    autoExportConfigSnapshot();
    return NextResponse.json({ reward });
  } catch (e) {
    console.error("[Loyalty Rewards PATCH]", e);
    return NextResponse.json({ error: "Błąd aktualizacji nagrody" }, { status: 500 });
  }
}
