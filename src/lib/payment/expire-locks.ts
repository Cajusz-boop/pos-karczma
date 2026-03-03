import type { PrismaClient } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { emitTableEvent } from "@/lib/sse/event-bus";

export async function processExpiredLocks(prisma: PrismaClient): Promise<number> {
  const expired = await prisma.onlinePayment.findMany({
    where: { status: "PENDING", expiresAt: { lt: new Date() } },
    include: {
      order: { include: { table: { select: { qrId: true } } } },
    },
  });

  let count = 0;
  for (const payment of expired) {
    try {
      const items = (payment.itemsJson as Array<{ orderItemId: string; quantity: number }>) ?? [];
      await prisma.$transaction(async (tx) => {
        for (const item of items) {
          await tx.orderItem.update({
            where: { id: item.orderItemId },
            data: { lockedQuantity: { decrement: item.quantity } },
          });
        }
        await tx.onlinePayment.update({
          where: { id: payment.id },
          data: { status: "EXPIRED" },
        });
        await auditLog(null, "LOCK_EXPIRED", "OnlinePayment", payment.id);
      });
      const qrId = payment.order.table?.qrId;
      if (qrId) {
        emitTableEvent(qrId, {
          type: "ITEM_UNLOCKED",
          payload: { items, paymentId: payment.id },
        });
      }
      count++;
    } catch (e) {
      console.error("[expire-locks] Failed for payment", payment.id, e);
    }
  }
  return count;
}
