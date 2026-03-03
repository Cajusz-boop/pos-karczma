import { prisma } from "@/lib/prisma";
import * as Sentry from "@sentry/nextjs";
import { posnetDriver } from "@/lib/fiscal";
import type { ReceiptPayload } from "@/lib/fiscal/types";

type OnlinePaymentPayload = {
  source: "ONLINE_PAYMENT";
  onlinePaymentId: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    fiscalSymbol: string;
  }>;
  amount: number;
  tipAmount: number;
};

export async function processOnlinePaymentFiscalEvent(
  eventId: string
): Promise<{ success: boolean; fiscalNumber?: string; error?: string }> {
  const event = await prisma.fiscalEvent.findUnique({
    where: { id: eventId },
  });

  let orderNumber = 0;
  if (event?.orderId) {
    const order = await prisma.order.findUnique({
      where: { id: event.orderId },
      select: { orderNumber: true },
    });
    orderNumber = order?.orderNumber ?? 0;
  }

  if (!event || event.type !== "RECEIPT_PRINTED" || event.status !== "PENDING") {
    return { success: false, error: "Event not found or not pending" };
  }

  const payload = event.payloadJson as OnlinePaymentPayload | null;
  if (!payload || payload.source !== "ONLINE_PAYMENT") {
    return { success: false, error: "Not an ONLINE_PAYMENT event" };
  }

  const receiptPayload: ReceiptPayload = {
    orderNumber,
    items: payload.items.map((i) => ({
      name: i.name.substring(0, 40),
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      vatSymbol: i.fiscalSymbol || "A",
    })),
    payments: [{ method: "ELECTRONIC", amount: payload.amount }],
  };

  const result = await posnetDriver.printReceipt(receiptPayload);

  await prisma.fiscalEvent.update({
    where: { id: eventId },
    data: {
      status: result.success ? "OK" : "ERROR",
      fiscalNumber: result.fiscalNumber ?? undefined,
      errorMessage: result.error ?? undefined,
    },
  });

  if (!result.success) {
    Sentry.captureMessage("FiscalEvent ONLINE_PAYMENT — błąd druku paragonu", {
      level: "error",
      tags: { fiscalEventId: eventId, orderId: event.orderId ?? "" },
      extra: { error: result.error, onlinePaymentId: payload.onlinePaymentId },
    });
  }

  if (result.success && result.fiscalNumber) {
    await prisma.receipt.updateMany({
      where: { orderId: event.orderId ?? "" },
      data: { fiscalNumber: result.fiscalNumber },
    });
  }

  return result;
}
