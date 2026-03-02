export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    if (productId) {
      const recipe = await prisma.recipe.findUnique({
        where: { productId },
        include: {
          product: { select: { id: true, name: true, priceGross: true } },
          items: { include: { ingredient: { include: { stockItems: { take: 1 } } } } },
        },
      });
      if (!recipe) return NextResponse.json(null);
      const cost = recipe.items.reduce((sum, ri) => {
        const stock = ri.ingredient.stockItems?.[0];
        const price = stock?.lastDeliveryPrice != null ? Number(stock.lastDeliveryPrice) : 0;
        return sum + (Number(ri.quantity) * price);
      }, 0);
      const priceGross = Number(recipe.product.priceGross);
      const foodCostPercent = priceGross > 0 ? (cost / (priceGross / (1 + 0.08))) * 100 : 0;
      return NextResponse.json({
        id: recipe.id,
        productId: recipe.productId,
        productName: recipe.product.name,
        productPriceGross: recipe.product.priceGross,
        yieldQty: Number(recipe.yieldQty),
        items: recipe.items.map((ri) => ({
          id: ri.id,
          ingredientId: ri.ingredientId,
          ingredientName: ri.ingredient.name,
          quantity: Number(ri.quantity),
          unit: ri.unit,
        })),
        costEstimate: cost,
        foodCostPercent,
      });
    }
    const recipes = await prisma.recipe.findMany({
      include: {
        product: { select: { id: true, name: true, priceGross: true } },
        items: { include: { ingredient: true } },
      },
    });
    return NextResponse.json(
      recipes.map((r) => ({
        id: r.id,
        productId: r.productId,
        productName: r.product.name,
        yieldQty: Number(r.yieldQty),
        itemsCount: r.items.length,
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania receptur" }, { status: 500 });
  }
}

type RecipeItemInput = { ingredientId: string; quantity: number; unit: string };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, yieldQty, items } = body as {
      productId: string;
      yieldQty?: number;
      items: RecipeItemInput[];
    };
    if (!productId) return NextResponse.json({ error: "productId jest wymagane" }, { status: 400 });
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: "Produkt nie istnieje" }, { status: 404 });

    const yq = yieldQty != null ? Number(yieldQty) : 1;
    const itemsNorm = (Array.isArray(items) ? items : []).map((i) => ({
      ingredientId: i.ingredientId,
      quantity: Number(i.quantity),
      unit: String(i.unit || "szt").trim(),
    }));

    await prisma.$transaction(async (tx) => {
      const recipe = await tx.recipe.upsert({
        where: { productId },
        create: { productId, yieldQty: yq },
        update: { yieldQty: yq },
      });
      await tx.recipeItem.deleteMany({ where: { recipeId: recipe.id } });
      for (const it of itemsNorm) {
        await tx.recipeItem.create({
          data: {
            recipeId: recipe.id,
            ingredientId: it.ingredientId,
            quantity: it.quantity,
            unit: it.unit,
          },
        });
      }
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd zapisu receptury" }, { status: 500 });
  }
}
