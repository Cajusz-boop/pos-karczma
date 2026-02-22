// @ts-expect-error - no type definitions
import webPush from "web-push";
import { prisma } from "@/lib/prisma";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:admin@karczma-labedz.pl";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export { VAPID_PUBLIC_KEY };

/**
 * Send push notification to a specific user.
 * Also saves the notification in the database for history.
 */
export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; icon?: string; data?: Record<string, unknown> }
): Promise<{ sent: number; failed: number }> {
  // Save notification to database
  await prisma.notification.create({
    data: {
      userId,
      title: payload.title,
      body: payload.body,
      type: (payload.data?.type as string) ?? "GENERAL",
      entityId: (payload.data?.orderId as string) ?? null,
    },
  }).catch((e) => console.error("[Push] Error saving notification:", e));
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return { sent: 0, failed: 0 };
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      );
      sent++;
    } catch (e) {
      failed++;
      // Remove invalid subscriptions (410 Gone)
      if (e instanceof webPush.WebPushError && (e.statusCode === 410 || e.statusCode === 404)) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
    }
  }

  return { sent, failed };
}

/**
 * Send push notification to all users with a specific role.
 */
export async function sendPushToRole(
  roleName: string,
  payload: { title: string; body: string; icon?: string; data?: Record<string, unknown> }
): Promise<{ sent: number; failed: number }> {
  const users = await prisma.user.findMany({
    where: { isActive: true, role: { name: roleName } },
    select: { id: true },
  });

  let totalSent = 0;
  let totalFailed = 0;

  for (const user of users) {
    const result = await sendPushToUser(user.id, payload);
    totalSent += result.sent;
    totalFailed += result.failed;
  }

  return { sent: totalSent, failed: totalFailed };
}
