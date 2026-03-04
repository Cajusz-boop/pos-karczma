import { NextRequest, NextResponse } from "next/server";
import { getUpcomingEventOrders } from "@/lib/hotelSystemApi";
import { prisma } from "@/lib/prisma";

export interface ProcurementItem {
  productId: number;
  productName: string;
  totalQuantity: number;
  unit: string;
  stockMinimum: number | null;
  deficit: number; // totalQuantity - stockMinimum (0 if no minimum or surplus)
}

/** GET /api/procurement/calculate?weekStart=YYYY-MM-DD&weekEnd=YYYY-MM-DD */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const weekStartStr = searchParams.get("weekStart");
    const weekEndStr = searchParams.get("weekEnd");

    if (!weekStartStr || !weekEndStr) {
      return NextResponse.json(
        { error: "weekStart i weekEnd są wymagane (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const weekStart = new Date(weekStartStr + "T00:00:00");
    const weekEnd = new Date(weekEndStr + "T23:59:59");

    if (isNaN(weekStart.getTime()) || isNaN(weekEnd.getTime())) {
      return NextResponse.json(
        { error: "Nieprawidłowy format daty" },
        { status: 400 }
      );
    }

    const hotelSystemConfigured = !!process.env.HOTEL_SYSTEM_URL?.trim();
    let events: Awaited<ReturnType<typeof getUpcomingEventOrders>> = [];
    try {
      events = await getUpcomingEventOrders();
    } catch (e) {
      console.error("[procurement/calculate] HotelSystem error:", e);
    }

    const filtered = events.filter((e) => {
      if (e.status !== "CONFIRMED") return false;
      if (e.packageId == null) return false;
      if (e.guestCount == null || e.guestCount < 1) return false;
      const dateFrom = e.dateFrom ? new Date(e.dateFrom) : null;
      if (!dateFrom || isNaN(dateFrom.getTime())) return false;
      return dateFrom >= weekStart && dateFrom <= weekEnd;
    });

    const aggregated = new Map<
      number,
      { name: string; quantity: number; unit: string }
    >();

    for (const event of filtered) {
      const pkg = await prisma.eventPackage.findUnique({
        where: { id: event.packageId! },
        include: {
          items: {
            include: {
              recipeDish: {
                include: {
                  ingredients: {
                    include: {
                      product: true,
                      subRecipe: {
                        include: {
                          ingredients: { include: { product: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!pkg) continue;

      const guestCount = Math.floor(event.guestCount);

      for (const item of pkg.items) {
        const portionsPerPerson = item.portionsPerPerson ?? 1;
        const dish = item.recipeDish;
        const basePortions = dish.basePortions > 0 ? dish.basePortions : 1;

        for (const ing of dish.ingredients) {
          const factor =
            (portionsPerPerson * guestCount * ing.quantity) / basePortions;

          if (ing.productId && ing.product) {
            const pid = ing.product.id;
            const existing = aggregated.get(pid);
            const qty = factor;
            const unit = ing.unit ?? ing.product.defaultUnit ?? "kg";
            if (existing) {
              existing.quantity += qty;
            } else {
              aggregated.set(pid, {
                name: ing.product.name,
                quantity: qty,
                unit,
              });
            }
          }

          if (ing.subRecipeId && ing.subRecipe) {
            for (const subIng of ing.subRecipe.ingredients) {
              if (!subIng.productId || !subIng.product) continue;
              const subFactor = factor * subIng.quantity;
              const subBase =
                ing.subRecipe.basePortions > 0
                  ? ing.subRecipe.basePortions
                  : 1;
              const subQty = subFactor / subBase;
              const pid = subIng.product.id;
              const unit =
                subIng.unit ?? subIng.product.defaultUnit ?? "kg";
              const existing = aggregated.get(pid);
              if (existing) {
                existing.quantity += subQty;
              } else {
                aggregated.set(pid, {
                  name: subIng.product.name,
                  quantity: subQty,
                  unit,
                });
              }
            }
          }
        }
      }
    }

    const stockMinimums = await prisma.stockMinimum.findMany({
      where: { productId: { in: Array.from(aggregated.keys()) } },
    });
    const minMap = new Map(stockMinimums.map((m) => [m.productId, m]));

    const result: ProcurementItem[] = Array.from(aggregated.entries()).map(
      ([productId, { name, quantity, unit }]) => {
        const sm = minMap.get(productId);
        const minimum = sm ? sm.minimum : null;
        const deficit =
          minimum != null && quantity < minimum ? minimum - quantity : 0;
        return {
          productId,
          productName: name,
          totalQuantity: Math.round(quantity * 1000) / 1000,
          unit,
          stockMinimum: minimum,
          deficit: Math.round(deficit * 1000) / 1000,
        };
      }
    );

    result.sort((a, b) => a.productName.localeCompare(b.productName));

    return NextResponse.json({
      items: result,
      eventsCount: filtered.length,
      hotelSystemConfigured,
      events: filtered.map((e) => ({
        id: e.id,
        name: e.name,
        eventType: e.eventType,
        dateFrom: e.dateFrom,
        guestCount: e.guestCount,
        packageId: e.packageId,
      })),
    });
  } catch (e) {
    console.error("[procurement/calculate]", e);
    return NextResponse.json(
      { error: "Błąd obliczania zapotrzebowania" },
      { status: 500 }
    );
  }
}
