export const dynamic = 'force-dynamic';

﻿import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";


const generateSettlementSchema = z.object({
  driverId: z.string().min(1, "ID kierowcy jest wymagane"),
  shiftDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Wymagany format YYYY-MM-DD"),
});

const settleSchema = z.object({
  settlementId: z.string().min(1),
  cashCollected: z.number().min(0),
  note: z.string().optional(),
});

/**
 * GET /api/delivery/settlements - list settlements
 * Query: ?driverId=xxx&dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&status=PENDING
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get("driverId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};

    if (driverId) {
      where.driverId = driverId;
    }

    if (dateFrom || dateTo) {
      where.shiftDate = {};
      if (dateFrom) (where.shiftDate as Record<string, Date>).gte = new Date(dateFrom);
      if (dateTo) (where.shiftDate as Record<string, Date>).lte = new Date(dateTo);
    }

    if (status) {
      where.status = status;
    }

    const settlements = await prisma.driverSettlement.findMany({
      where,
      include: {
        driver: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { shiftDate: "desc" },
      take: 100,
    });

    return NextResponse.json({
      settlements: settlements.map((s) => ({
        id: s.id,
        driverId: s.driverId,
        driverName: s.driver.user.name,
        shiftDate: s.shiftDate.toISOString().split("T")[0],
        totalDeliveries: s.totalDeliveries,
        totalValue: Number(s.totalValue),
        totalCommission: Number(s.totalCommission),
        cashCollected: Number(s.cashCollected),
        status: s.status,
        settledAt: s.settledAt?.toISOString() ?? null,
        note: s.note,
        createdAt: s.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error("[DriverSettlements GET]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d pobierania rozliczeĹ„" }, { status: 500 });
  }
}

/**
 * POST /api/delivery/settlements - generate settlement for a driver+date
 * Aggregates all delivered orders for that day
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = generateSettlementSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "NieprawidĹ‚owe dane" },
        { status: 400 }
      );
    }

    const { driverId, shiftDate } = parsed.data;
    const dateObj = new Date(shiftDate);
    const dateStart = new Date(dateObj);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(dateObj);
    dateEnd.setHours(23, 59, 59, 999);

    const driver = await prisma.deliveryDriver.findUnique({
      where: { id: driverId },
      include: { user: { select: { name: true } } },
    });

    if (!driver) {
      return NextResponse.json({ error: "Kierowca nie istnieje" }, { status: 404 });
    }

    const existing = await prisma.driverSettlement.findUnique({
      where: {
        driverId_shiftDate: { driverId, shiftDate: dateObj },
      },
    });

    if (existing && existing.status === "SETTLED") {
      return NextResponse.json(
        { error: "To rozliczenie zostaĹ‚o juĹĽ zamkniÄ™te" },
        { status: 400 }
      );
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        action: "DELIVERY_COMPLETED",
        timestamp: { gte: dateStart, lte: dateEnd },
        metadata: { path: "$.driverId", equals: driverId },
      },
      select: { entityId: true },
    });

    const orderIds = auditLogs
      .map((a) => a.entityId)
      .filter((id): id is string => id !== null);

    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        deliveryStatus: "DELIVERED",
      },
      select: {
        id: true,
        totalGross: true,
        driverCommission: true,
        payments: {
          select: { method: true, amount: true },
        },
      },
    });

    const totalDeliveries = orders.length;
    const totalValue = orders.reduce((sum, o) => sum + Number(o.totalGross), 0);
    const totalCommission = orders.reduce((sum, o) => sum + Number(o.driverCommission ?? 0), 0);
    const cashCollected = orders.reduce((sum, o) => {
      const cashPayments = o.payments.filter((p) => p.method === "CASH");
      return sum + cashPayments.reduce((s, p) => s + Number(p.amount), 0);
    }, 0);

    const settlement = await prisma.driverSettlement.upsert({
      where: {
        driverId_shiftDate: { driverId, shiftDate: dateObj },
      },
      create: {
        driverId,
        shiftDate: dateObj,
        totalDeliveries,
        totalValue,
        totalCommission,
        cashCollected,
        status: "PENDING",
      },
      update: {
        totalDeliveries,
        totalValue,
        totalCommission,
        cashCollected,
        status: "PENDING",
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "DRIVER_SETTLEMENT_GENERATED", "DriverSettlement", settlement.id, undefined, {
      driverId,
      shiftDate,
      totalDeliveries,
      totalCommission,
    });

    return NextResponse.json({
      settlement: {
        id: settlement.id,
        driverId: settlement.driverId,
        driverName: driver.user.name,
        shiftDate: settlement.shiftDate.toISOString().split("T")[0],
        totalDeliveries: settlement.totalDeliveries,
        totalValue: Number(settlement.totalValue),
        totalCommission: Number(settlement.totalCommission),
        cashCollected: Number(settlement.cashCollected),
        status: settlement.status,
      },
    }, { status: existing ? 200 : 201 });
  } catch (e) {
    console.error("[DriverSettlements POST]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d generowania rozliczenia" }, { status: 500 });
  }
}

/**
 * PATCH /api/delivery/settlements - settle (close) a settlement
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = settleSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "NieprawidĹ‚owe dane" },
        { status: 400 }
      );
    }

    const { settlementId, cashCollected, note } = parsed.data;
    const userId = request.headers.get("x-user-id");

    const settlement = await prisma.driverSettlement.findUnique({
      where: { id: settlementId },
    });

    if (!settlement) {
      return NextResponse.json({ error: "Rozliczenie nie istnieje" }, { status: 404 });
    }

    if (settlement.status === "SETTLED") {
      return NextResponse.json({ error: "To rozliczenie zostaĹ‚o juĹĽ zamkniÄ™te" }, { status: 400 });
    }

    const updated = await prisma.driverSettlement.update({
      where: { id: settlementId },
      data: {
        cashCollected,
        status: "SETTLED",
        settledAt: new Date(),
        settledByUserId: userId,
        note,
      },
      include: {
        driver: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    await auditLog(userId, "DRIVER_SETTLEMENT_CLOSED", "DriverSettlement", settlementId, undefined, {
      cashCollected,
      totalCommission: Number(settlement.totalCommission),
    });

    return NextResponse.json({
      settlement: {
        id: updated.id,
        driverId: updated.driverId,
        driverName: updated.driver.user.name,
        shiftDate: updated.shiftDate.toISOString().split("T")[0],
        totalDeliveries: updated.totalDeliveries,
        totalValue: Number(updated.totalValue),
        totalCommission: Number(updated.totalCommission),
        cashCollected: Number(updated.cashCollected),
        status: updated.status,
        settledAt: updated.settledAt?.toISOString() ?? null,
        note: updated.note,
      },
    });
  } catch (e) {
    console.error("[DriverSettlements PATCH]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d zamykania rozliczenia" }, { status: 500 });
  }
}
