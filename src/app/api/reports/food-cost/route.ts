export const dynamic = 'force-dynamic';

﻿import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


interface FoodCostItem {
  productId: string;
  productName: string;
  categoryName: string;
  priceGross: number;
  costPrice: number;
  margin: number;
  marginPercent: number;
  foodCostPercent: number;
  qtySold: number;
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
  alert: boolean;
}

/**
 * GET /api/reports/food-cost â€” food cost report
 * Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD&threshold=35
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const threshold = parseFloat(searchParams.get("threshold") ?? "35");

    const dateFrom = from ? new Date(from) : new Date(new Date().setDate(new Date().getDate() - 30));
    const dateTo = to ? new Date(to + "T23:59:59") : new Date();

    // Get all products with cost price
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: { select: { name: true } },
      },
    });

    // Get sales data for the period
    const salesData = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        status: { not: "CANCELLED" },
        order: {
          status: "CLOSED",
          closedAt: { gte: dateFrom, lte: dateTo },
        },
      },
      _sum: {
        quantity: true,
      },
    });

    const salesMap = new Map(
      salesData.map((s) => [s.productId, Number(s._sum.quantity ?? 0)])
    );

    // Also get revenue per product
    const revenueData = await prisma.orderItem.findMany({
      where: {
        status: { not: "CANCELLED" },
        order: {
          status: "CLOSED",
          closedAt: { gte: dateFrom, lte: dateTo },
        },
      },
      select: {
        productId: true,
        quantity: true,
        unitPrice: true,
        discountAmount: true,
      },
    });

    const revenueMap = new Map<string, number>();
    for (const item of revenueData) {
      const revenue = Number(item.quantity) * Number(item.unitPrice) - Number(item.discountAmount ?? 0);
      revenueMap.set(item.productId, (revenueMap.get(item.productId) ?? 0) + revenue);
    }

    // Build report
    const items: FoodCostItem[] = [];
    let totalRevenue = 0;
    let totalCost = 0;
    let alertCount = 0;

    for (const product of products) {
      const priceGross = Number(product.priceGross);
      const costPrice = Number(product.costPrice ?? 0);
      const qtySold = salesMap.get(product.id) ?? 0;
      const revenue = revenueMap.get(product.id) ?? 0;
      const cost = costPrice * qtySold;
      const margin = priceGross - costPrice;
      const marginPercent = priceGross > 0 ? (margin / priceGross) * 100 : 0;
      const foodCostPercent = priceGross > 0 ? (costPrice / priceGross) * 100 : 0;
      const alert = costPrice > 0 && foodCostPercent > threshold;

      if (alert) alertCount++;
      totalRevenue += revenue;
      totalCost += cost;

      items.push({
        productId: product.id,
        productName: product.name,
        categoryName: product.category.name,
        priceGross,
        costPrice,
        margin: Math.round(margin * 100) / 100,
        marginPercent: Math.round(marginPercent * 10) / 10,
        foodCostPercent: Math.round(foodCostPercent * 10) / 10,
        qtySold,
        totalRevenue: Math.round(revenue * 100) / 100,
        totalCost: Math.round(cost * 100) / 100,
        totalMargin: Math.round((revenue - cost) * 100) / 100,
        alert,
      });
    }

    // Sort by food cost % descending (worst first)
    items.sort((a, b) => b.foodCostPercent - a.foodCostPercent);

    const overallFoodCost = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;

    return NextResponse.json({
      period: { from: dateFrom.toISOString(), to: dateTo.toISOString() },
      threshold,
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        totalMargin: Math.round((totalRevenue - totalCost) * 100) / 100,
        overallFoodCostPercent: Math.round(overallFoodCost * 10) / 10,
        productCount: items.length,
        alertCount,
        productsWithCost: items.filter((i) => i.costPrice > 0).length,
        productsWithoutCost: items.filter((i) => i.costPrice === 0).length,
      },
      items,
    });
  } catch (e) {
    console.error("[Food Cost Report]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d raportu food cost" }, { status: 500 });
  }
}
