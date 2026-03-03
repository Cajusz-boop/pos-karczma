export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/public/fallback?tableNumber=5&roomId=xxx
 * Fallback dla uszkodzonego QR — wyszukuje stolik po numerze i zwraca qrId.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tableNumber = parseInt(searchParams.get("tableNumber") ?? "", 10);
    const roomId = searchParams.get("roomId");

    if (isNaN(tableNumber) || tableNumber < 1) {
      return NextResponse.json(
        { error: "Invalid tableNumber" },
        { status: 400 }
      );
    }

    const where: { number: number; qrId: { not: null }; isAvailable: boolean } = {
      number: tableNumber,
      qrId: { not: null },
      isAvailable: true,
    };
    if (roomId) {
      (where as Record<string, unknown>).roomId = roomId;
    }

    const table = await prisma.table.findFirst({
      where,
      select: { qrId: true },
    });

    if (!table?.qrId) {
      return NextResponse.json({ error: "TABLE_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({
      redirectUrl: `/receipt/${table.qrId}`,
      qrId: table.qrId,
    });
  } catch (e) {
    console.error("[fallback] GET error:", e);
    return NextResponse.json(
      { error: "Błąd wyszukiwania stolika" },
      { status: 500 }
    );
  }
}
