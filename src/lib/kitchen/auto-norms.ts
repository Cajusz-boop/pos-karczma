import { prisma } from "@/lib/prisma";

const MIN_SAMPLES = 50;

/**
 * Calculate median of an array of numbers.
 */
function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Auto-learn preparation time norms for products.
 * Calculates median prep time (startedAt -> readyAt) from the last N completed items.
 * Only updates products that have at least MIN_SAMPLES completed items.
 *
 * Returns the number of products updated.
 */
export async function autoLearnPrepNorms(): Promise<{
  productsAnalyzed: number;
  productsUpdated: number;
  details: Array<{ productId: string; name: string; samples: number; medianMinutes: number; previousMinutes: number | null }>;
}> {
  // Get all products with completed items that have timing data
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, estimatedPrepMinutes: true },
  });

  const details: Array<{
    productId: string;
    name: string;
    samples: number;
    medianMinutes: number;
    previousMinutes: number | null;
  }> = [];

  let productsUpdated = 0;

  for (const product of products) {
    // Get completed items with timing data for this product
    const items = await prisma.orderItem.findMany({
      where: {
        productId: product.id,
        status: { in: ["READY", "SERVED"] },
        startedAt: { not: null },
        readyAt: { not: null },
      },
      select: {
        startedAt: true,
        readyAt: true,
      },
      orderBy: { readyAt: "desc" },
      take: 200,
    });

    if (items.length < MIN_SAMPLES) continue;

    // Calculate prep times in minutes
    const prepTimes = items
      .filter((i) => i.startedAt && i.readyAt)
      .map((i) => (i.readyAt!.getTime() - i.startedAt!.getTime()) / 60000)
      .filter((t) => t > 0 && t < 120); // Filter outliers (0-120 min)

    if (prepTimes.length < MIN_SAMPLES) continue;

    const medianMinutes = Math.round(median(prepTimes));

    // Only update if significantly different from current estimate (>20% change)
    const current = product.estimatedPrepMinutes;
    const shouldUpdate =
      current === null ||
      Math.abs(medianMinutes - current) / Math.max(current, 1) > 0.2;

    if (shouldUpdate && medianMinutes > 0) {
      await prisma.product.update({
        where: { id: product.id },
        data: { estimatedPrepMinutes: medianMinutes },
      });
      productsUpdated++;
    }

    details.push({
      productId: product.id,
      name: product.name,
      samples: prepTimes.length,
      medianMinutes,
      previousMinutes: current,
    });
  }

  return {
    productsAnalyzed: details.length,
    productsUpdated,
    details,
  };
}
