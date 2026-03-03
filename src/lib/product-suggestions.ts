/**
 * Reguły sugestii produktów (cross-sell) i logika priorytetu po marży.
 * Używane przy auto-tworzeniu sugestii dla nowych produktów.
 */

import type { PrismaClient } from "@/lib/prisma";

/** Kategoria bazowa -> kategorie sugerowane (nazwy) */
const SUGGEST_TO_CATEGORIES: Record<string, string[]> = {
  "Mięsne": ["Alkohol", "Piwo", "Desery"],
  "Rybne": ["Alkohol", "Piwo", "Desery"],
  "Wege": ["Alkohol", "Napoje", "Desery"],
  "Zupy": ["Mięsne", "Rybne", "Wege", "Napoje"],
  "Przystawki": ["Zupy", "Alkohol", "Piwo", "Mięsne", "Rybne", "Wege"],
  "Desery": ["Napoje"],
};

/** Kategorie sugerowanych produktów, gdzie używamy marży do priorytetu */
const MARGIN_PRIORITY_CATEGORIES = ["Piwo", "Alkohol"];

function toNum(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "object" && v !== null && "toNumber" in v && typeof (v as { toNumber: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  return 0;
}

/** Wyższa marża = wyższy priorytet. Brak costPrice -> 0. */
function marginPriority(priceGross: number, costPrice: unknown): number {
  const cost = toNum(costPrice);
  if (cost <= 0) return 0;
  const margin = priceGross - cost;
  return Math.max(0, Math.round(margin * 100));
}

/**
 * Tworzy sugestie dla nowo dodanego produktu na podstawie jego kategorii.
 */
export async function createSuggestionsForNewProduct(
  prisma: PrismaClient,
  productId: string,
  categoryId: string,
  categoryName: string
): Promise<number> {
  const targetNames = SUGGEST_TO_CATEGORIES[categoryName];
  if (!targetNames?.length) return 0;

  const categories = await prisma.category.findMany({
    where: { name: { in: targetNames } },
    select: { id: true, name: true },
  });
  const targetCategoryIds = categories.map((c) => c.id);

  const candidates = await prisma.product.findMany({
    where: {
      categoryId: { in: targetCategoryIds },
      id: { not: productId },
      isActive: true,
    },
    select: { id: true, priceGross: true, costPrice: true, category: { select: { name: true } } },
  });

  let count = 0;
  for (const suggested of candidates) {
    const targetCatName = suggested.category.name;
    const useMargin = MARGIN_PRIORITY_CATEGORIES.includes(targetCatName);
    const priceGross = toNum(suggested.priceGross);
    const priority = useMargin ? marginPriority(priceGross, suggested.costPrice) : 0;
    try {
      await prisma.productSuggestion.upsert({
        where: { productId_suggestedId: { productId, suggestedId: suggested.id } },
        update: { priority, type: "CROSS_SELL", isActive: true },
        create: { productId, suggestedId: suggested.id, type: "CROSS_SELL", priority },
      });
      count++;
    } catch {
      // duplicate
    }
  }
  return count;
}

/**
 * Gdy nowy produkt jest z Piwo/Alkohol – dodaj go jako sugestię do dań głównych.
 */
export async function addNewBeverageAsSuggestionToMainDishes(
  prisma: PrismaClient,
  newProductId: string,
  priceGross: number,
  costPrice: unknown
): Promise<number> {
  const mainDishCategories = await prisma.category.findMany({
    where: { name: { in: ["Mięsne", "Rybne", "Wege"] } },
    select: { id: true },
  });
  const mainDishProductIds = await prisma.product
    .findMany({
      where: { categoryId: { in: mainDishCategories.map((c) => c.id) }, isActive: true },
      select: { id: true },
    })
    .then((list) => list.map((p) => p.id).filter((id) => id !== newProductId));

  const priority = marginPriority(priceGross, costPrice);
  let count = 0;
  for (const baseProductId of mainDishProductIds) {
    try {
      await prisma.productSuggestion.upsert({
        where: { productId_suggestedId: { productId: baseProductId, suggestedId: newProductId } },
        update: { priority, type: "CROSS_SELL", isActive: true },
        create: { productId: baseProductId, suggestedId: newProductId, type: "CROSS_SELL", priority },
      });
      count++;
    } catch {
      // skip
    }
  }
  return count;
}
