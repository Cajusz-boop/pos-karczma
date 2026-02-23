import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';


export interface TipConfig {
  poolEnabled: boolean;
  poolPercentage: number;
  kitchenShare: number;
  barShare: number;
}

const DEFAULT_CONFIG: TipConfig = {
  poolEnabled: false,
  poolPercentage: 30,
  kitchenShare: 20,
  barShare: 10,
};

const CONFIG_KEY = "tip_pooling";

async function getTipConfig(): Promise<TipConfig> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: CONFIG_KEY },
    });
    if (config?.value && typeof config.value === "object") {
      return { ...DEFAULT_CONFIG, ...(config.value as object) } as TipConfig;
    }
  } catch (e) {
    console.error("[Tips] Error reading config:", e);
  }
  return DEFAULT_CONFIG;
}

/**
 * GET /api/tips â€” tip report for a date range
 * Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD&userId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const userId = searchParams.get("userId");

    const dateFrom = from ? new Date(from) : new Date(new Date().setHours(0, 0, 0, 0));
    const dateTo = to ? new Date(to + "T23:59:59") : new Date();

    const where: Record<string, unknown> = {
      createdAt: { gte: dateFrom, lte: dateTo },
    };
    if (userId) where.userId = userId;

    const tips = await prisma.tip.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        order: { select: { id: true, orderNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Aggregate per waiter
    const byWaiter: Record<string, { userId: string; name: string; total: number; count: number; tips: typeof tips }> = {};
    for (const tip of tips) {
      const uid = tip.userId;
      if (!byWaiter[uid]) {
        byWaiter[uid] = { userId: uid, name: tip.user.name, total: 0, count: 0, tips: [] };
      }
      byWaiter[uid].total += Number(tip.amount);
      byWaiter[uid].count += 1;
      byWaiter[uid].tips.push(tip);
    }

    const config = await getTipConfig();
    const grandTotal = tips.reduce((s, t) => s + Number(t.amount), 0);

    // Calculate pool distribution
    let poolAmount = 0;
    let kitchenAmount = 0;
    let barAmount = 0;
    const waiterReports: {
      userId: string;
      name: string;
      grossTips: number;
      poolContribution: number;
      netTips: number;
      count: number;
    }[] = [];

    if (config.poolEnabled) {
      poolAmount = Math.round(grandTotal * (config.poolPercentage / 100) * 100) / 100;
      kitchenAmount = Math.round(poolAmount * (config.kitchenShare / 100) * 100) / 100;
      barAmount = Math.round(poolAmount * (config.barShare / 100) * 100) / 100;
      const remainingPool = poolAmount - kitchenAmount - barAmount;
      const waiterCount = Object.keys(byWaiter).length;
      const equalShare = waiterCount > 0 ? Math.round((remainingPool / waiterCount) * 100) / 100 : 0;

      for (const w of Object.values(byWaiter)) {
        const contribution = Math.round(w.total * (config.poolPercentage / 100) * 100) / 100;
        waiterReports.push({
          userId: w.userId,
          name: w.name,
          grossTips: Math.round(w.total * 100) / 100,
          poolContribution: contribution,
          netTips: Math.round((w.total - contribution + equalShare) * 100) / 100,
          count: w.count,
        });
      }
    } else {
      for (const w of Object.values(byWaiter)) {
        waiterReports.push({
          userId: w.userId,
          name: w.name,
          grossTips: Math.round(w.total * 100) / 100,
          poolContribution: 0,
          netTips: Math.round(w.total * 100) / 100,
          count: w.count,
        });
      }
    }

    return NextResponse.json({
      config,
      period: { from: dateFrom.toISOString(), to: dateTo.toISOString() },
      grandTotal: Math.round(grandTotal * 100) / 100,
      totalTips: tips.length,
      pool: {
        enabled: config.poolEnabled,
        amount: poolAmount,
        kitchenShare: kitchenAmount,
        barShare: barAmount,
      },
      waiters: waiterReports.sort((a, b) => b.grossTips - a.grossTips),
    });
  } catch (e) {
    console.error("[Tips GET]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d raportu napiwkĂłw" }, { status: 500 });
  }
}

/**
 * PUT /api/tips â€” update tip pooling configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const config: TipConfig = {
      poolEnabled: Boolean(body.poolEnabled),
      poolPercentage: Math.min(100, Math.max(0, Number(body.poolPercentage) || 0)),
      kitchenShare: Math.min(100, Math.max(0, Number(body.kitchenShare) || 0)),
      barShare: Math.min(100, Math.max(0, Number(body.barShare) || 0)),
    };

    await prisma.systemConfig.upsert({
      where: { key: CONFIG_KEY },
      create: { key: CONFIG_KEY, value: config as unknown as object },
      update: { value: config as unknown as object },
    });

    return NextResponse.json({ config });
  } catch (e) {
    console.error("[Tips PUT]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d zapisu konfiguracji" }, { status: 500 });
  }
}
