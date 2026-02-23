import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export const dynamic = 'force-dynamic';


/** GET /api/reports/audit?dateFrom=&dateTo=&userId=&action=&entityType= â€” log audytowy */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");

    const where: { timestamp?: { gte: Date; lte: Date }; userId?: string; action?: string; entityType?: string } = {};
    if (dateFrom && dateTo) {
      where.timestamp = { gte: startOfDay(new Date(dateFrom)), lte: endOfDay(new Date(dateTo)) };
    } else if (dateFrom) {
      where.timestamp = { gte: startOfDay(new Date(dateFrom)), lte: endOfDay(new Date(dateFrom)) };
    } else if (dateTo) {
      where.timestamp = { gte: startOfDay(new Date(dateTo)), lte: endOfDay(new Date(dateTo)) };
    }
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: 300,
      include: { user: { select: { name: true } } },
    });

    const list = logs.map((l) => ({
      id: l.id,
      timestamp: l.timestamp.toISOString(),
      userId: l.userId,
      userName: l.user?.name ?? "",
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      metadata: l.metadata,
    }));

    return NextResponse.json({ logs: list });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "BĹ‚Ä…d logu audytowego" }, { status: 500 });
  }
}
