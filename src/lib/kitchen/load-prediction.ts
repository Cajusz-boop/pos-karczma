import { prisma } from "@/lib/prisma";
import { subWeeks, startOfDay, endOfDay, getDay, getHours, format } from "date-fns";

/**
 * Predict kitchen load for the next few hours based on historical data.
 * Uses the same day-of-week from the last 4 weeks as reference.
 */
export async function predictKitchenLoad(): Promise<{
  currentHour: number;
  currentLoad: number;
  predictions: Array<{
    hour: number;
    expectedItems: number;
    confidence: "low" | "medium" | "high";
    isAboveAverage: boolean;
    isPeak: boolean;
  }>;
  alerts: string[];
  historicalAvgByHour: Record<number, number>;
}> {
  const now = new Date();
  const currentDayOfWeek = getDay(now);
  const currentHour = getHours(now);

  // Get historical data from same day of week, last 4 weeks
  const historicalDates: Date[] = [];
  for (let w = 1; w <= 4; w++) {
    historicalDates.push(subWeeks(now, w));
  }

  // Count items per hour for each historical day
  const hourlyData: Record<number, number[]> = {};
  for (let h = 0; h < 24; h++) {
    hourlyData[h] = [];
  }

  for (const refDate of historicalDates) {
    const dayStart = startOfDay(refDate);
    const dayEnd = endOfDay(refDate);

    const items = await prisma.orderItem.findMany({
      where: {
        sentToKitchenAt: { gte: dayStart, lte: dayEnd },
        status: { not: "CANCELLED" },
      },
      select: { sentToKitchenAt: true, quantity: true },
    });

    // Group by hour
    const byHour: Record<number, number> = {};
    for (const item of items) {
      if (!item.sentToKitchenAt) continue;
      const h = getHours(item.sentToKitchenAt);
      byHour[h] = (byHour[h] ?? 0) + Number(item.quantity);
    }

    for (let h = 0; h < 24; h++) {
      hourlyData[h].push(byHour[h] ?? 0);
    }
  }

  // Calculate averages per hour
  const historicalAvgByHour: Record<number, number> = {};
  for (let h = 0; h < 24; h++) {
    const data = hourlyData[h];
    historicalAvgByHour[h] = data.length > 0
      ? Math.round(data.reduce((s, v) => s + v, 0) / data.length)
      : 0;
  }

  // Current load (items in kitchen right now)
  const currentLoad = await prisma.orderItem.count({
    where: { status: { in: ["SENT", "IN_PROGRESS"] } },
  });

  // Find peak hour
  let peakHour = 12;
  let peakValue = 0;
  for (let h = 10; h <= 22; h++) {
    if (historicalAvgByHour[h] > peakValue) {
      peakValue = historicalAvgByHour[h];
      peakHour = h;
    }
  }

  // Overall daily average per hour
  const allHourValues = Object.values(historicalAvgByHour).filter((v) => v > 0);
  const overallAvg = allHourValues.length > 0
    ? allHourValues.reduce((s, v) => s + v, 0) / allHourValues.length
    : 0;

  // Build predictions for next 6 hours
  const predictions: Array<{
    hour: number;
    expectedItems: number;
    confidence: "low" | "medium" | "high";
    isAboveAverage: boolean;
    isPeak: boolean;
  }> = [];

  for (let offset = 0; offset < 6; offset++) {
    const h = (currentHour + offset) % 24;
    const data = hourlyData[h];
    const expected = historicalAvgByHour[h];
    const confidence: "low" | "medium" | "high" =
      data.filter((v) => v > 0).length >= 3 ? "high" :
      data.filter((v) => v > 0).length >= 2 ? "medium" : "low";

    predictions.push({
      hour: h,
      expectedItems: expected,
      confidence,
      isAboveAverage: expected > overallAvg * 1.2,
      isPeak: h === peakHour,
    });
  }

  // Generate alerts
  const alerts: string[] = [];

  // Alert if peak is coming in 1-2 hours
  for (const pred of predictions.slice(1, 3)) {
    if (pred.isPeak && pred.expectedItems > 0) {
      alerts.push(
        `Szczyt obłożenia o ${pred.hour}:00 — spodziewane ~${pred.expectedItems} pozycji`
      );
    }
  }

  // Alert if next hour is significantly above average
  if (predictions[1] && predictions[1].isAboveAverage && predictions[1].expectedItems > overallAvg * 1.5) {
    alerts.push(
      `Za godzinę (${predictions[1].hour}:00) spodziewane zwiększone obłożenie: ~${predictions[1].expectedItems} pozycji`
    );
  }

  // Alert if current load is already high
  if (currentLoad > peakValue * 0.8 && peakValue > 0) {
    alerts.push(
      `Aktualne obłożenie (${currentLoad} pozycji) zbliża się do szczytu`
    );
  }

  return {
    currentHour,
    currentLoad,
    predictions,
    alerts,
    historicalAvgByHour,
  };
}
