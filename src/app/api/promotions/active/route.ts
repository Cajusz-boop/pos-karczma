import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ... 6=Sat

    const promotions = await prisma.promotion.findMany({
      where: {
        isActive: true,
        validFrom: { lte: now },
        validTo: { gte: now },
      },
    });

    const activePromotions = promotions.filter((p) => {
      const daysOfWeek = p.daysOfWeek as unknown;
      if (!Array.isArray(daysOfWeek)) return false;
      return daysOfWeek.includes(currentDayOfWeek);
    });

    return NextResponse.json(activePromotions);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Błąd pobierania aktywnych promocji" },
      { status: 500 }
    );
  }
}
