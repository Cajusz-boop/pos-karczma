import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';


/**
 * GET /api/notifications?unread=true&limit=20 â€” list notifications for current user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const unreadOnly = request.nextUrl.searchParams.get("unread") === "true";
    const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "20");

    const where: Record<string, unknown> = { userId };
    if (unreadOnly) where.readAt = null;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId, readAt: null },
      }),
    ]);

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        type: n.type,
        entityId: n.entityId,
        readAt: n.readAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "BĹ‚Ä…d pobierania powiadomieĹ„" }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications â€” mark notifications as read
 * Body: { ids: string[] } or { all: true }
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const body = await request.json();
    const { ids, all } = body as { ids?: string[]; all?: boolean };
    const now = new Date();

    if (all) {
      await prisma.notification.updateMany({
        where: { userId, readAt: null },
        data: { readAt: now },
      });
    } else if (ids && ids.length > 0) {
      await prisma.notification.updateMany({
        where: { id: { in: ids }, userId },
        data: { readAt: now },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "BĹ‚Ä…d oznaczania powiadomieĹ„" }, { status: 500 });
  }
}
