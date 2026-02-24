import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { VAPID_PUBLIC_KEY } from "@/lib/push/web-push";

/**
 * GET /api/push — get VAPID public key for client subscription
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    publicKey: VAPID_PUBLIC_KEY,
    enabled: !!VAPID_PUBLIC_KEY,
  });
}

/**
 * POST /api/push — subscribe to push notifications
 * Body: { subscription: { endpoint, keys: { p256dh, auth } } }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const body = await request.json();
    const { subscription } = body as {
      subscription?: {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
    };

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: "Nieprawidłowa subskrypcja" }, { status: 400 });
    }

    // Upsert subscription
    const existing = await prisma.pushSubscription.findFirst({
      where: {
        userId,
        endpoint: subscription.endpoint,
      },
    });

    if (existing) {
      await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      });
    } else {
      await prisma.pushSubscription.create({
        data: {
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd subskrypcji push" }, { status: 500 });
  }
}

/**
 * DELETE /api/push — unsubscribe from push notifications
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { endpoint } = body as { endpoint?: string };

    if (endpoint) {
      await prisma.pushSubscription.deleteMany({
        where: { userId, endpoint },
      });
    } else {
      await prisma.pushSubscription.deleteMany({
        where: { userId },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd usuwania subskrypcji" }, { status: 500 });
  }
}
