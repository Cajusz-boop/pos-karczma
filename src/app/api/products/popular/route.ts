import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

/**
 * GET /api/products/popular?limit=8&days=7 — top products by order frequency
 */
export async function GET(request: NextRequest) {
  try {
    const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "8");
    const days = parseInt(request.nextUrl.searchParams.get("days") ?? "7");
    const since = subDays(new Date(), days);

    // Aggregate order items by product in the last N days
    const topProducts = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        status: { not: "CANCELLED" },
        createdAt: { gte: since },
      },
      _sum: { quantity: true },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: limit,
    });

    if (topProducts.length === 0) {
      return NextResponse.json([]);
    }

    const productIds = topProducts.map((t) => t.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true, isAvailable: true },
      select: {
        id: true,
        name: true,
        priceGross: true,
        taxRateId: true,
        color: true,
        categoryId: true,
        category: { select: { name: true } },
      },
    });

    // Merge with order counts and sort by frequency
    const productMap = new Map(products.map((p) => [p.id, p]));
    const result = topProducts
      .map((t) => {
        const p = productMap.get(t.productId);
        if (!p) return null;
        return {
          id: p.id,
          name: p.name,
          priceGross: Number(p.priceGross),
          taxRateId: p.taxRateId,
          color: p.color,
          categoryName: p.category.name,
          orderCount: t._count.id,
          totalQuantity: Number(t._sum.quantity ?? 0),
        };
      })
      .filter(Boolean);

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json([], { status: 200 });
  }
}
