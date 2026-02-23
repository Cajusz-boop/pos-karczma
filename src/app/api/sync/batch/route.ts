import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import type { OrderType, PaymentMethod } from "../../../../../prisma/generated/prisma/enums";
import { posnetDriver } from "@/lib/fiscal";
import { addDays } from "date-fns";

interface BatchOperation {
  queueId: number;
  operationId: string; // Idempotency key
  operation: "CREATE" | "UPDATE" | "DELETE";
  table: "orders" | "orderItems" | "payments";
  localId: string;
  parentServerId?: string;
  data: Record<string, unknown>;
  timestamp: string;
}

interface BatchResultItem {
  queueId: number;
  success: boolean;
  serverId?: string;
  serverVersion?: number;
  error?: string;
  receiptUrl?: string;
  receiptQrData?: string;
  fiscalNumber?: string;
}

// P14-FIX: Batch endpoint WYMAGA autoryzacji — NIE dodawaj do PUBLIC_API_ROUTES!
export async function POST(request: NextRequest) {
  // P14-FIX: Auth sprawdzany przez middleware (JWT/session)
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const operations: BatchOperation[] = body.operations;

    if (!Array.isArray(operations) || operations.length === 0) {
      return NextResponse.json({ error: "No operations" }, { status: 400 });
    }

    const results: BatchResultItem[] = [];

    for (const op of operations) {
      try {
        // Idempotency check — skip if already processed
        const existing = await prisma.syncLog.findUnique({
          where: { operationId: op.operationId },
        });
        if (existing) {
          results.push({
            queueId: op.queueId,
            success: true,
            serverId: existing.serverId ?? undefined,
            serverVersion: existing.serverVersion ?? undefined,
          });
          continue;
        }

        const result = await processOperation(op, userId);
        results.push({ queueId: op.queueId, ...result });

        // V4-24: Audit log dla operacji offline (offlineTimestamp = prawdziwy czas operacji)
        if (result.success) {
          const entityType = op.table === "orders" ? "Order" : op.table === "orderItems" ? "OrderItem" : "Payment";
          await auditLog(
            userId,
            `SYNC_${op.table}_${op.operation}`,
            entityType,
            result.serverId,
            undefined,
            op.data,
            {
              offlineOperationId: op.operationId,
              offlineTimestamp: op.timestamp,
              syncedAt: new Date().toISOString(),
            }
          );
        }

      } catch (e) {
        results.push({
          queueId: op.queueId,
          success: false,
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    return NextResponse.json(results);
  } catch (e) {
    console.error("[SyncBatch] Error:", e);
    return NextResponse.json({ error: "Batch sync failed" }, { status: 500 });
  }
}

async function processOperation(op: BatchOperation, userId: string): Promise<Omit<BatchResultItem, "queueId">> {
  switch (op.table) {
    case "orders":
      return processOrderOp(op, userId);
    case "orderItems":
      return processOrderItemOp(op);
    case "payments":
      return processPaymentOp(op);
    default:
      return { success: false, error: `Unknown table: ${op.table}` };
  }
}

async function processOrderOp(op: BatchOperation, userId: string): Promise<Omit<BatchResultItem, "queueId">> {
  if (op.operation === "CREATE") {
    // P6-FIX: SyncLog w transakcji z operacją — brak duplikatów po retry
    const result = await prisma.$transaction(async (tx) => {
      // Get next order number
      const lastOrder = await tx.order.findFirst({
        orderBy: { orderNumber: "desc" },
        select: { orderNumber: true },
      });
      const nextOrderNumber = (lastOrder?.orderNumber ?? 0) + 1;

      const order = await tx.order.create({
        data: {
          tableId: op.data.tableId as string | undefined,
          roomId: op.data.roomId as string | undefined,
          userId: (op.data.userId as string) || userId,
          type: ((op.data.type as string) ?? "DINE_IN") as OrderType,
          guestCount: (op.data.guestCount as number) ?? 1,
          status: "OPEN",
          orderNumber: nextOrderNumber,
        },
      });

      // Update table status
      if (op.data.tableId) {
        await tx.table.update({
          where: { id: op.data.tableId as string },
          data: { status: "OCCUPIED" },
        }).catch(() => {});
      }

      // P6-FIX: SyncLog w tej samej transakcji
      await tx.syncLog.create({
        data: {
          operationId: op.operationId,
          table: op.table,
          localId: op.localId,
          serverId: order.id,
          serverVersion: 1,
          success: true,
          processedAt: new Date(),
        },
      });

      return { serverId: order.id };
    });

    return { success: true, serverId: result.serverId, serverVersion: 1 };
  }

  if (op.operation === "UPDATE") {
    const action = op.data.action as string;

    if (action === "SEND_TO_KITCHEN") {
      // Find order by local ID reference or server ID
      const serverId = op.parentServerId || await getServerIdFromLocalId(op.localId, "orders");
      if (!serverId) return { success: false, error: "Order not found on server" };

      await prisma.$transaction(async (tx) => {
        await tx.orderItem.updateMany({
          where: { orderId: serverId, status: "ORDERED" },
          data: { status: "SENT", sentToKitchenAt: new Date() },
        });
        await tx.order.update({
          where: { id: serverId },
          data: { status: "SENT_TO_KITCHEN" },
        });
        await tx.syncLog.create({
          data: {
            operationId: op.operationId,
            table: op.table,
            localId: op.localId,
            serverId: serverId,
            success: true,
            processedAt: new Date(),
          },
        });
      });

      return { success: true, serverId };
    }

    if (action === "CLOSE") {
      const serverId = op.parentServerId || await getServerIdFromLocalId(op.localId, "orders");
      if (!serverId) return { success: false, error: "Order not found on server" };

      await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: serverId },
          select: { status: true, tableId: true },
        });

        if (order?.status === "CLOSED") {
          throw new Error("ORDER_ALREADY_CLOSED");
        }

        await tx.order.update({
          where: { id: serverId },
          data: { status: "CLOSED", closedAt: new Date() },
        });

        if (order?.tableId) {
          await tx.table.update({
            where: { id: order.tableId },
            data: { status: "FREE" },
          }).catch(() => {});
        }

        await tx.syncLog.create({
          data: {
            operationId: op.operationId,
            table: op.table,
            localId: op.localId,
            serverId,
            success: true,
            processedAt: new Date(),
          },
        });
      });

      return { success: true, serverId };
    }

    if (action === "TRANSFER_TABLE") {
      const serverId = op.parentServerId || await getServerIdFromLocalId(op.localId, "orders");
      if (!serverId) return { success: false, error: "Order not found on server" };

      const newTableId = op.data.newTableId as string;
      if (!newTableId) return { success: false, error: "newTableId required" };

      await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: serverId },
          select: { tableId: true },
        });
        if (order?.tableId) {
          await tx.table.update({
            where: { id: order.tableId },
            data: { status: "FREE" },
          }).catch(() => {});
        }
        await tx.order.update({
          where: { id: serverId },
          data: { tableId: newTableId },
        });
        await tx.table.update({
          where: { id: newTableId },
          data: { status: "OCCUPIED" },
        }).catch(() => {});
        await tx.syncLog.create({
          data: {
            operationId: op.operationId,
            table: op.table,
            localId: op.localId,
            serverId,
            success: true,
            processedAt: new Date(),
          },
        });
      });

      return { success: true, serverId };
    }

    if (action === "APPLY_DISCOUNT") {
      const serverId = op.parentServerId || await getServerIdFromLocalId(op.localId, "orders");
      if (!serverId) return { success: false, error: "Order not found on server" };

      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: serverId },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: { discountJson: op.data.discount as any },
        });
        await tx.syncLog.create({
          data: {
            operationId: op.operationId,
            table: op.table,
            localId: op.localId,
            serverId,
            success: true,
            processedAt: new Date(),
          },
        });
      });

      return { success: true, serverId };
    }
  }

  return { success: false, error: "Unsupported order operation" };
}

async function processOrderItemOp(op: BatchOperation): Promise<Omit<BatchResultItem, "queueId">> {
  if (op.operation === "CREATE") {
    if (!op.parentServerId) {
      return { success: false, error: "Parent order not synced yet" };
    }

    // P6-FIX: SyncLog w transakcji
    const result = await prisma.$transaction(async (tx) => {
      // Get product data for caching (future use for fiscal printing)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _product = await tx.product.findUnique({
        where: { id: op.data.productId as string },
        select: { name: true, nameShort: true, taxRate: { select: { ratePercent: true, fiscalSymbol: true } } },
      });

      const item = await tx.orderItem.create({
        data: {
          orderId: op.parentServerId!,
          productId: op.data.productId as string,
          quantity: op.data.quantity as number,
          unitPrice: op.data.unitPrice as number,
          taxRateId: op.data.taxRateId as string,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          modifiersJson: op.data.modifiersJson as any,
          note: op.data.note as string | undefined,
          courseNumber: (op.data.courseNumber as number) ?? 1,
          status: "ORDERED",
        },
      });

      // Update order totals
      interface ModifierData { priceDelta?: number }
      const modifierTotal = ((op.data.modifiersJson as ModifierData[]) ?? []).reduce(
        (sum: number, m: ModifierData) => sum + (m.priceDelta || 0), 0
      );
      const lineTotal = (op.data.quantity as number) * ((op.data.unitPrice as number) + modifierTotal);

      await tx.order.update({
        where: { id: op.parentServerId! },
        data: {
          itemCount: { increment: 1 },
          totalGross: { increment: lineTotal },
        },
      });

      await tx.syncLog.create({
        data: {
          operationId: op.operationId,
          table: op.table,
          localId: op.localId,
          serverId: item.id,
          serverVersion: 1,
          success: true,
          processedAt: new Date(),
        },
      });

      return { serverId: item.id };
    });

    return { success: true, serverId: result.serverId, serverVersion: 1 };
  }

  if (op.operation === "UPDATE") {
    const action = op.data.action as string;

    if (action === "CANCEL") {
      const serverId = await getServerIdFromLocalId(op.localId, "orderItems");
      if (!serverId) return { success: false, error: "Item not found on server" };

      await prisma.$transaction(async (tx) => {
        const item = await tx.orderItem.findUnique({
          where: { id: serverId },
          select: { quantity: true, unitPrice: true, modifiersJson: true, orderId: true },
        });

        if (item) {
          interface ModifierData { priceDelta?: number }
          const modifierTotal = ((item.modifiersJson as ModifierData[] | null) ?? []).reduce(
            (sum: number, m: ModifierData) => sum + (m.priceDelta || 0), 0
          );
          const lineTotal = Number(item.quantity) * (Number(item.unitPrice) + modifierTotal);

          await tx.orderItem.update({
            where: { id: serverId },
            data: {
              status: "CANCELLED",
              cancelledAt: new Date(),
              cancelReason: op.data.reason as string | undefined,
            },
          });

          await tx.order.update({
            where: { id: item.orderId },
            data: {
              itemCount: { decrement: 1 },
              totalGross: { decrement: lineTotal },
            },
          });
        }

        await tx.syncLog.create({
          data: {
            operationId: op.operationId,
            table: op.table,
            localId: op.localId,
            serverId,
            success: true,
            processedAt: new Date(),
          },
        });
      });

      return { success: true, serverId };
    }

    if (action === "UPDATE_QUANTITY") {
      const serverId = await getServerIdFromLocalId(op.localId, "orderItems");
      if (!serverId) return { success: false, error: "Item not found on server" };

      await prisma.$transaction(async (tx) => {
        const item = await tx.orderItem.findUnique({
          where: { id: serverId },
          select: { quantity: true, unitPrice: true, modifiersJson: true, orderId: true },
        });

        if (item) {
          interface ModifierData { priceDelta?: number }
          const modifierTotal = ((item.modifiersJson as ModifierData[] | null) ?? []).reduce(
            (sum: number, m: ModifierData) => sum + (m.priceDelta || 0), 0
          );
          const oldLineTotal = Number(item.quantity) * (Number(item.unitPrice) + modifierTotal);
          const newQuantity = op.data.quantity as number;
          const newLineTotal = newQuantity * (Number(item.unitPrice) + modifierTotal);
          const diff = newLineTotal - oldLineTotal;

          await tx.orderItem.update({
            where: { id: serverId },
            data: { quantity: newQuantity },
          });

          await tx.order.update({
            where: { id: item.orderId },
            data: { totalGross: { increment: diff } },
          });
        }

        await tx.syncLog.create({
          data: {
            operationId: op.operationId,
            table: op.table,
            localId: op.localId,
            serverId,
            success: true,
            processedAt: new Date(),
          },
        });
      });

      return { success: true, serverId };
    }
  }

  return { success: false, error: "Unsupported item operation" };
}

async function processPaymentOp(op: BatchOperation): Promise<Omit<BatchResultItem, "queueId">> {
  if (op.operation === "CREATE") {
    if (!op.parentServerId) {
      return { success: false, error: "Parent order not synced yet" };
    }

    // P12-FIX: Server-side guard — sprawdź czy order nie jest już CLOSED dla płatności IN
    const direction = (op.data.direction as string) || "IN";
    if (direction === "IN") {
      const existingOrder = await prisma.order.findUnique({
        where: { id: op.parentServerId },
        select: { status: true },
      });
      if (existingOrder?.status === "CLOSED") {
        return { success: false, error: "ORDER_ALREADY_CLOSED" };
      }
    }

    // P6-FIX: Cała operacja w transakcji z SyncLog
    const result = await prisma.$transaction(async (tx) => {
      // Re-check w transakcji (optimistic lock) for IN payments
      if (direction === "IN") {
        const order = await tx.order.findUnique({
          where: { id: op.parentServerId! },
          select: { status: true, tableId: true },
        });
        if (order?.status === "CLOSED") {
          throw new Error("ORDER_ALREADY_CLOSED");
        }
      }

      // Create payment
      const payment = await tx.payment.create({
        data: {
          orderId: op.parentServerId!,
          method: (op.data.method as string) as PaymentMethod,
          amount: op.data.amount as number,
          tipAmount: (op.data.tipAmount as number) ?? 0,
          transactionRef: op.data.transactionRef as string | undefined,
        },
      });

      // SyncLog
      await tx.syncLog.create({
        data: {
          operationId: op.operationId,
          table: op.table,
          localId: op.localId,
          serverId: payment.id,
          serverVersion: 1,
          success: true,
          processedAt: new Date(),
        },
      });

      // Create FiscalEvent for refunds
      if (direction === "OUT") {
        await tx.fiscalEvent.create({
          data: {
            orderId: op.parentServerId!,
            paymentId: payment.id,
            type: "REFUND_PRINTED",
            status: "PENDING",
            payloadJson: {
              amount: op.data.amount,
              method: op.data.method,
              reason: op.data.reason,
            } as unknown as Prisma.InputJsonValue,
          },
        });
      }

      return { paymentId: payment.id, orderId: op.parentServerId! };
    });

    // Fiscalize + e-receipt (async — don't block sync) - only for IN payments
    let fiscalNumber: string | undefined;
    let receiptUrl: string | undefined;
    let receiptQrData: string | undefined;

    if (direction === "IN") {
      try {
        const fiscalResult = await fiscalizePayment(result.orderId, result.paymentId);
        fiscalNumber = fiscalResult.fiscalNumber;
        receiptUrl = fiscalResult.receiptUrl;
        receiptQrData = fiscalResult.receiptQrData;
      } catch (e) {
        // P-RECEIPT-FIX: Log error zamiast cichego catch
        console.error("[SyncBatch] Fiscalization failed:", e);
        await prisma.receiptErrorLog.create({
          data: {
            orderId: result.orderId,
            paymentId: result.paymentId,
            errorMessage: e instanceof Error ? e.message : "Unknown fiscal error",
          },
        }).catch((logErr) => console.error("[SyncBatch] Receipt error log failed:", logErr));
      }
    }

    return {
      success: true,
      serverId: result.paymentId,
      serverVersion: 1,
      fiscalNumber,
      receiptUrl,
      receiptQrData,
    };
  }

  return { success: false, error: "Unsupported payment operation" };
}

async function fiscalizePayment(
  orderId: string,
  paymentId: string
): Promise<{ fiscalNumber?: string; receiptUrl?: string; receiptQrData?: string }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        where: { status: { not: "CANCELLED" } },
        include: { product: true, taxRate: true },
      },
      payments: { where: { id: paymentId } },
    },
  });

  if (!order || order.payments.length === 0) return {};

  // Print fiscal receipt
  const receiptPayload = {
    orderNumber: order.orderNumber,
    items: order.items.map((i) => ({
      name: i.product.name,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      vatSymbol: i.taxRate.fiscalSymbol || "A",
    })),
    payments: order.payments.map((p) => ({
      method: p.method,
      amount: Number(p.amount),
    })),
  };

  const printResult = await posnetDriver.printReceipt(receiptPayload);
  const fiscalNumber = printResult.success ? printResult.fiscalNumber : undefined;

  // Generate e-receipt token
  const receiptToken = `r_${crypto.randomUUID().slice(0, 12)}`;
  const receiptUrl = `/e-receipt/${receiptToken}`;

  // Save receipt
  await prisma.receipt.create({
    data: {
      orderId,
      fiscalNumber: fiscalNumber ?? `NF-${Date.now()}`,
      printerId: "posnet-trio",
      token: receiptToken,
      expiresAt: addDays(new Date(), 30),
    },
  }).catch(() => {});

  return { fiscalNumber, receiptUrl, receiptQrData: receiptUrl };
}

async function getServerIdFromLocalId(localId: string, table: string): Promise<string | undefined> {
  const syncLog = await prisma.syncLog.findFirst({
    where: { localId, table },
    select: { serverId: true },
  });
  return syncLog?.serverId ?? undefined;
}
