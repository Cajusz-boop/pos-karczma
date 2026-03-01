import { db, PosOfflineDB, type LocalOrder, type LocalOrderItem } from "@/lib/db/offline-db";
import { queueOperation, syncEngine } from "@/lib/sync/sync-engine";

/** V4-21: Lokalny numer zamówienia offline — prefix L- dla wyświetlania. Serwer nadpisuje przy sync. */
async function getNextLocalOrderNumber(): Promise<number> {
  const checkpoint = await db.syncCheckpoints.get("_lastOrderNumber");
  const last = checkpoint?.lastSyncAt ? parseInt(checkpoint.lastSyncAt, 10) : 0;
  const next = last + 1;
  await db.syncCheckpoints.put({
    id: "_lastOrderNumber",
    lastSyncAt: String(next),
  });
  return next;
}

/**
 * Create a new order — works offline.
 */
export async function createOrderOffline(params: {
  tableId?: string;
  roomId?: string;
  userId: string;
  userName: string;
  type: LocalOrder["type"];
  guestCount: number;
  tableNumber?: number;
  roomName?: string;
}): Promise<string> {
  const localId = PosOfflineDB.generateLocalId();
  const now = new Date().toISOString();
  const localOrderNum = await getNextLocalOrderNumber();

  await db.transaction("rw", [db.orders, db.syncQueue], async () => {
    await db.orders.add({
      _localId: localId,
      _syncStatus: "pending",
      _localVersion: 1,
      _updatedAt: now,
      tableId: params.tableId,
      roomId: params.roomId,
      userId: params.userId,
      userName: params.userName,
      status: "OPEN",
      type: params.type,
      guestCount: params.guestCount,
      createdAt: now,
      totalGross: 0,
      itemCount: 0,
      tableNumber: params.tableNumber,
      roomName: params.roomName,
      orderNumber: localOrderNum,
    });

    await queueOperation("CREATE", "orders", localId, {
      tableId: params.tableId,
      roomId: params.roomId,
      userId: params.userId,
      type: params.type,
      guestCount: params.guestCount,
    });
  });

  // Update table status locally
  if (params.tableId) {
    await db.posTables.update(params.tableId, { status: "OCCUPIED" });
  }

  return localId;
}

/**
 * Hydrate order from API create response into Dexie — so OrderPageClient finds it.
 * Call after POST /api/orders succeeds. Uses serverId as lookup key.
 */
export async function hydrateOrderFromApiCreate(params: {
  serverId: string;
  orderNumber: number;
  type: LocalOrder["type"];
  tableId?: string;
  roomId?: string;
  userId: string;
  userName: string;
  guestCount: number;
}): Promise<void> {
  if (typeof window === "undefined") return;
  const now = new Date().toISOString();
  const localId = `hydration_${params.serverId}`;

  let tableNumber: number | undefined;
  let roomName: string | undefined;
  if (params.tableId) {
    const table = await db.posTables.get(params.tableId);
    tableNumber = table?.number;
    if (table?.roomId) {
      const room = await db.rooms.get(table.roomId);
      roomName = room?.name;
    }
  }

  await db.transaction("rw", [db.orders, db.posTables], async () => {
    await db.orders.put({
      _localId: localId,
      _serverId: params.serverId,
      _syncStatus: "synced",
      _localVersion: 1,
      _updatedAt: now,
      tableId: params.tableId,
      roomId: params.roomId,
      userId: params.userId,
      userName: params.userName,
      status: "OPEN",
      type: params.type,
      guestCount: params.guestCount,
      createdAt: now,
      totalGross: 0,
      itemCount: 0,
      orderNumber: params.orderNumber,
      tableNumber,
      roomName,
    } as LocalOrder);
    if (params.tableId) {
      await db.posTables.update(params.tableId, { status: "OCCUPIED" });
    }
  });
}

/**
 * Add item to order — works offline.
 * Atomic transaction: item + order totals + sync queue.
 */
export async function addItemToOrder(
  orderLocalId: string,
  item: {
    productId: string;
    productName: string;
    productNameShort?: string;
    quantity: number;
    unitPrice: number;
    taxRateId: string;
    taxRatePercent: number;
    fiscalSymbol: string;
    modifiersJson?: LocalOrderItem["modifiersJson"];
    note?: string;
    courseNumber?: number;
  }
): Promise<string> {
  const itemLocalId = PosOfflineDB.generateLocalId();
  const now = new Date().toISOString();

  const modifierTotal = (item.modifiersJson ?? []).reduce((sum, m) => sum + m.priceDelta, 0);
  const lineTotal = item.quantity * (item.unitPrice + modifierTotal);

  await db.transaction("rw", [db.orderItems, db.orders, db.syncQueue], async () => {
    await db.orderItems.add({
      _localId: itemLocalId,
      _syncStatus: "pending",
      _localVersion: 1,
      _updatedAt: now,
      orderId: orderLocalId,
      productId: item.productId,
      productName: item.productName,
      productNameShort: item.productNameShort,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRateId: item.taxRateId,
      taxRatePercent: item.taxRatePercent,
      fiscalSymbol: item.fiscalSymbol,
      discountAmount: 0,
      modifiersJson: item.modifiersJson,
      note: item.note,
      courseNumber: item.courseNumber ?? 1,
      status: "ORDERED",
      isTakeaway: false,
      isFire: false,
      isRush: false,
    });

    // P9-FIX: Atomic modify — brak stale read przy concurrent operations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.orders.where("_localId").equals(orderLocalId).modify((order: any) => {
      order.totalGross += lineTotal;
      order.itemCount += 1;
      order._localVersion += 1;
      order._updatedAt = now;
      order._syncStatus = "pending";
    });

    await queueOperation("CREATE", "orderItems", itemLocalId, {
      orderId: orderLocalId,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRateId: item.taxRateId,
      modifiersJson: item.modifiersJson,
      note: item.note,
      courseNumber: item.courseNumber ?? 1,
    }, [orderLocalId]); // depends on order being synced first
  });

  return itemLocalId;
}

/**
 * Update item quantity — works offline.
 */
export async function updateItemQuantity(
  orderLocalId: string,
  itemLocalId: string,
  newQuantity: number
): Promise<void> {
  const now = new Date().toISOString();

  await db.transaction("rw", [db.orderItems, db.orders, db.syncQueue], async () => {
    const item = await db.orderItems.get(itemLocalId);
    if (!item || item.status === "CANCELLED") return;

    const modTotal = (item.modifiersJson ?? []).reduce((s, m) => s + m.priceDelta, 0);
    const oldLineTotal = item.quantity * (item.unitPrice + modTotal);
    const newLineTotal = newQuantity * (item.unitPrice + modTotal);
    const diff = newLineTotal - oldLineTotal;

    await db.orderItems.update(itemLocalId, {
      quantity: newQuantity,
      _localVersion: item._localVersion + 1,
      _updatedAt: now,
      _syncStatus: "pending",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.orders.where("_localId").equals(orderLocalId).modify((order: any) => {
      order.totalGross += diff;
      order._localVersion += 1;
      order._updatedAt = now;
      order._syncStatus = "pending";
    });

    await queueOperation("UPDATE", "orderItems", itemLocalId, {
      action: "UPDATE_QUANTITY",
      orderId: orderLocalId,
      quantity: newQuantity,
    }, [orderLocalId]);
  });
}

/**
 * Send order to kitchen — queued if offline.
 */
export async function sendToKitchen(orderLocalId: string): Promise<void> {
  const now = new Date().toISOString();

  await db.transaction("rw", [db.orders, db.orderItems, db.syncQueue], async () => {
    const order = await db.orders.get(orderLocalId);
    if (!order) return;

    await db.orders.update(orderLocalId, {
      status: "SENT_TO_KITCHEN",
      _localVersion: order._localVersion + 1,
      _updatedAt: now,
      _syncStatus: "pending",
    });

    // Mark unsent items as SENT
    await db.orderItems
      .where("orderId").equals(orderLocalId)
      .filter((item) => item.status === "ORDERED")
      .modify({
        status: "SENT",
        sentToKitchenAt: now,
      });

    await queueOperation("UPDATE", "orders", orderLocalId, {
      action: "SEND_TO_KITCHEN",
    }, [orderLocalId]);
  });
}

/**
 * SPLIT PAYMENT: Add a single payment to order — does NOT close the order.
 * Call multiple times for split payment (e.g. CASH 200 + CARD 50).
 * Then call finalizeOrderOffline() to close.
 */
export async function addPaymentOffline(
  orderLocalId: string,
  userId: string,
  payment: {
    method: "CASH" | "CARD" | "BLIK" | "TRANSFER" | "VOUCHER" | "ROOM_CHARGE";
    amount: number;
    tipAmount?: number;
    customerNip?: string;
    customerEmail?: string;
    terminalProvider?: "stripe_tap" | "polcard" | "manual_cash" | "demo";
    terminalTransactionId?: string;
    cardLastFour?: string;
    cardBrand?: string;
  }
): Promise<{
  success: boolean;
  paymentLocalId?: string;
  error?: string;
}> {
  const locked = await db.acquirePaymentLock(orderLocalId, userId);
  if (!locked) {
    return { success: false, error: "Zamówienie przetwarzane przez innego kelnera" };
  }

  try {
    const paymentLocalId = PosOfflineDB.generateLocalId();
    const now = new Date().toISOString();

    await db.transaction("rw", [db.payments, db.syncQueue], async () => {
      await db.payments.add({
        _localId: paymentLocalId,
        _syncStatus: "pending",
        _localVersion: 1,
        _updatedAt: now,
        orderId: orderLocalId,
        method: payment.method,
        direction: "IN",
        status: "PENDING",
        amount: payment.amount,
        tipAmount: payment.tipAmount ?? 0,
        createdAt: now,
        terminalStatus: payment.method === "CASH" ? "none" : "approved",
        terminalProvider: payment.terminalProvider ?? "manual_cash",
        terminalTransactionId: payment.terminalTransactionId,
        cardLastFour: payment.cardLastFour,
        cardBrand: payment.cardBrand,
        customerNip: payment.customerNip,
        customerEmail: payment.customerEmail,
        receiptStatus: "pending",
        fiscalStatus: "pending",
      });

      await queueOperation("CREATE", "payments", paymentLocalId, {
        orderId: orderLocalId,
        method: payment.method,
        direction: "IN",
        amount: payment.amount,
        tipAmount: payment.tipAmount ?? 0,
        transactionRef: payment.terminalTransactionId,
        customerNip: payment.customerNip,
      }, [orderLocalId]);
    });

    if (navigator.onLine) syncEngine.pushNow();
    return { success: true, paymentLocalId };
  } finally {
    await db.releasePaymentLock(orderLocalId, userId);
  }
}

/**
 * SPLIT PAYMENT: Finalize/close order after all payments are added.
 * Validates paidTotal >= finalTotal locally before closing.
 */
export async function finalizeOrderOffline(
  orderLocalId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const locked = await db.acquirePaymentLock(orderLocalId, userId);
  if (!locked) {
    return { success: false, error: "Zamówienie przetwarzane przez innego kelnera" };
  }

  try {
    const order = await db.orders.get(orderLocalId);
    if (!order) return { success: false, error: "Zamówienie nie istnieje" };
    if (order.status === "CLOSED") return { success: false, error: "Już zamknięte" };

    // Calculate totals from local data
    const items = await db.orderItems
      .where("orderId").equals(orderLocalId)
      .filter(i => i.status !== "CANCELLED")
      .toArray();

    const payments = await db.payments
      .where("orderId").equals(orderLocalId)
      .filter(p => p.status !== "CANCELLED")
      .toArray();

    const itemsTotal = items.reduce((sum, i) => {
      const modTotal = (i.modifiersJson ?? []).reduce((s, m) => s + m.priceDelta, 0);
      return sum + i.quantity * (i.unitPrice + modTotal) - i.discountAmount;
    }, 0);

    // Apply order-level discount
    let discount = 0;
    if (order.discountJson) {
      if (order.discountJson.type === "PERCENT") {
        discount = (itemsTotal * order.discountJson.value) / 100;
      } else if (order.discountJson.type === "AMOUNT") {
        discount = order.discountJson.value;
      }
    }
    const finalTotal = Math.round((itemsTotal - discount) * 100) / 100;

    // Ledger: paidTotal = sum(IN) - sum(OUT)
    const paidTotal = Math.round(
      payments.reduce((sum, p) => {
        return sum + (p.direction === "OUT" ? -p.amount : p.amount);
      }, 0) * 100
    ) / 100;

    if (paidTotal + 0.01 < finalTotal && finalTotal > 0) {
      return {
        success: false,
        error: `Brakuje ${(finalTotal - paidTotal).toFixed(2)} zł (wpłacono ${paidTotal.toFixed(2)} z ${finalTotal.toFixed(2)})`,
      };
    }

    const now = new Date().toISOString();

    await db.transaction("rw", [db.orders, db.syncQueue], async () => {
      // P9-FIX: Atomic modify
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.orders.where("_localId").equals(orderLocalId).modify((o: any) => {
        o.status = "CLOSED";
        o.closedAt = now;
        o._localVersion += 1;
        o._updatedAt = now;
        o._syncStatus = "pending";
      });

      await queueOperation("UPDATE", "orders", orderLocalId, {
        action: "CLOSE",
      }, [orderLocalId]);
    });

    // Free table locally
    if (order.tableId) {
      await db.posTables.update(order.tableId, { status: "FREE" });
    }

    if (navigator.onLine) syncEngine.pushNow();
    return { success: true };
  } finally {
    await db.releasePaymentLock(orderLocalId, userId);
  }
}

/**
 * Convenience: single payment + close in one call (most common case).
 * Calls addPaymentOffline then finalizeOrderOffline.
 */
export async function payAndCloseOffline(
  orderLocalId: string,
  userId: string,
  payment: Parameters<typeof addPaymentOffline>[2]
): Promise<{ success: boolean; paymentLocalId?: string; error?: string }> {
  const payResult = await addPaymentOffline(orderLocalId, userId, payment);
  if (!payResult.success) return payResult;

  const closeResult = await finalizeOrderOffline(orderLocalId, userId);
  if (!closeResult.success) {
    return { success: false, error: closeResult.error, paymentLocalId: payResult.paymentLocalId };
  }

  return { success: true, paymentLocalId: payResult.paymentLocalId };
}

/**
 * Cancel/storno item from order — works offline.
 * Soft-delete: sets status to CANCELLED, recalculates totals.
 */
export async function cancelItemFromOrder(
  orderLocalId: string,
  itemLocalId: string,
  reason?: string
): Promise<void> {
  const now = new Date().toISOString();

  await db.transaction("rw", [db.orderItems, db.orders, db.syncQueue], async () => {
    const item = await db.orderItems.get(itemLocalId);
    if (!item || item.status === "CANCELLED") return;

    const modTotal = (item.modifiersJson ?? []).reduce((s, m) => s + m.priceDelta, 0);
    const lineTotal = item.quantity * (item.unitPrice + modTotal);

    // Soft-delete item
    await db.orderItems.update(itemLocalId, {
      status: "CANCELLED",
      cancelledAt: now,
      cancelReason: reason,
      _localVersion: item._localVersion + 1,
      _updatedAt: now,
      _syncStatus: "pending",
    });

    // P9-FIX: Atomic modify on order totals
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.orders.where("_localId").equals(orderLocalId).modify((order: any) => {
      order.totalGross = Math.max(0, order.totalGross - lineTotal);
      order.itemCount = Math.max(0, order.itemCount - 1);
      order._localVersion += 1;
      order._updatedAt = now;
      order._syncStatus = "pending";
    });

    await queueOperation("UPDATE", "orderItems", itemLocalId, {
      action: "CANCEL",
      orderId: orderLocalId,
      reason,
    }, [orderLocalId]);
  });
}

/**
 * Void a pending payment BEFORE it syncs to server.
 * Only works if payment is still in syncQueue (not yet sent).
 */
export async function voidPaymentOffline(
  paymentLocalId: string
): Promise<{ success: boolean; error?: string }> {
  const payment = await db.payments.get(paymentLocalId);
  if (!payment) return { success: false, error: "Płatność nie istnieje" };
  if (payment._syncStatus === "synced") {
    return { success: false, error: "Płatność już zsynchronizowana — użyj zwrotu" };
  }

  await db.transaction("rw", [db.payments, db.syncQueue], async () => {
    await db.payments.update(paymentLocalId, {
      status: "CANCELLED",
      _syncStatus: "synced", // Don't try to sync cancelled payment
      _updatedAt: new Date().toISOString(),
    });

    // Remove from sync queue if still pending
    await db.syncQueue
      .where("localId").equals(paymentLocalId)
      .delete();
  });

  return { success: true };
}

/**
 * Refund a payment AFTER order is closed and synced.
 * Creates a new payment with direction=OUT + queues FiscalEvent.
 */
export async function refundPaymentOffline(
  orderLocalId: string,
  originalPaymentLocalId: string,
  userId: string,
  amount: number,
  reason?: string
): Promise<{ success: boolean; refundLocalId?: string; error?: string }> {
  const originalPayment = await db.payments.get(originalPaymentLocalId);
  if (!originalPayment) return { success: false, error: "Oryginalna płatność nie istnieje" };
  if (amount > originalPayment.amount) {
    return { success: false, error: "Kwota zwrotu przekracza kwotę płatności" };
  }

  const refundLocalId = PosOfflineDB.generateLocalId();
  const now = new Date().toISOString();

  await db.transaction("rw", [db.payments, db.syncQueue], async () => {
    await db.payments.add({
      _localId: refundLocalId,
      _syncStatus: "pending",
      _localVersion: 1,
      _updatedAt: now,
      orderId: orderLocalId,
      method: originalPayment.method,
      direction: "OUT",
      status: "PENDING",
      amount,
      tipAmount: 0,
      createdAt: now,
      terminalStatus: "none",
      terminalProvider: "manual_cash",
      receiptStatus: "pending",
      fiscalStatus: "pending",
      refundsPaymentLocalId: originalPaymentLocalId,
    });

    await queueOperation("CREATE", "payments", refundLocalId, {
      orderId: orderLocalId,
      method: originalPayment.method,
      direction: "OUT",
      amount,
      reason,
      refundsPaymentServerId: originalPayment._serverId,
    }, [orderLocalId]);
  });

  if (navigator.onLine) syncEngine.pushNow();
  return { success: true, refundLocalId };
}

/**
 * Apply discount to order — works offline.
 */
export async function applyOrderDiscount(
  orderLocalId: string,
  discount: {
    type: "PERCENT" | "AMOUNT";
    value: number;
    reason?: string;
    authorizedBy?: string;
  }
): Promise<void> {
  const now = new Date().toISOString();

  await db.transaction("rw", [db.orders, db.syncQueue], async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.orders.where("_localId").equals(orderLocalId).modify((order: any) => {
      order.discountJson = discount;
      order._localVersion += 1;
      order._updatedAt = now;
      order._syncStatus = "pending";
    });

    await queueOperation("UPDATE", "orders", orderLocalId, {
      action: "APPLY_DISCOUNT",
      discount,
    }, [orderLocalId]);
  });
}

/**
 * V4-16: Transfer table offline — przenosi zamówienie na inny stolik.
 */
export async function transferTableOffline(
  orderLocalId: string,
  newTableId: string,
  newTableNumber: number,
  newRoomId?: string,
  newRoomName?: string
): Promise<void> {
  const now = new Date().toISOString();

  await db.transaction("rw", [db.orders, db.posTables, db.syncQueue], async () => {
    const order = await db.orders.get(orderLocalId);
    if (!order) return;

    if (order.tableId) {
      await db.posTables.update(order.tableId, { status: "FREE" });
    }

    await db.orders.update(orderLocalId, {
      tableId: newTableId,
      tableNumber: newTableNumber,
      roomId: newRoomId ?? order.roomId,
      roomName: newRoomName ?? order.roomName,
      _updatedAt: now,
      _syncStatus: "pending",
      _localVersion: order._localVersion + 1,
    } as Partial<LocalOrder>);

    await db.posTables.update(newTableId, { status: "OCCUPIED" });

    await queueOperation("UPDATE", "orders", orderLocalId, {
      action: "TRANSFER_TABLE",
      newTableId,
    }, [orderLocalId]);
  });
}

/**
 * Get order total with calculations.
 */
export async function getOrderTotal(orderLocalId: string): Promise<{
  itemsTotal: number;
  discount: number;
  finalTotal: number;
  paidTotal: number;
  remaining: number;
}> {
  const order = await db.orders.get(orderLocalId);
  if (!order) {
    return { itemsTotal: 0, discount: 0, finalTotal: 0, paidTotal: 0, remaining: 0 };
  }

  const items = await db.orderItems
    .where("orderId").equals(orderLocalId)
    .filter(i => i.status !== "CANCELLED")
    .toArray();

  const payments = await db.payments
    .where("orderId").equals(orderLocalId)
    .filter(p => p.status !== "CANCELLED")
    .toArray();

  const itemsTotal = items.reduce((sum, i) => {
    const modTotal = (i.modifiersJson ?? []).reduce((s, m) => s + m.priceDelta, 0);
    return sum + i.quantity * (i.unitPrice + modTotal) - i.discountAmount;
  }, 0);

  let discount = 0;
  if (order.discountJson) {
    if (order.discountJson.type === "PERCENT") {
      discount = (itemsTotal * order.discountJson.value) / 100;
    } else {
      discount = order.discountJson.value;
    }
  }

  const finalTotal = Math.round((itemsTotal - discount) * 100) / 100;

  const paidTotal = Math.round(
    payments.reduce((sum, p) => {
      return sum + (p.direction === "OUT" ? -p.amount : p.amount);
    }, 0) * 100
  ) / 100;

  const remaining = Math.max(0, Math.round((finalTotal - paidTotal) * 100) / 100);

  return { itemsTotal, discount, finalTotal, paidTotal, remaining };
}
