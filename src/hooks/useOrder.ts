import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/offline-db";
import type { LocalOrder } from "@/lib/db/offline-db";

const isBrowser = () => typeof window !== "undefined";

/**
 * Get current order with items — reactive.
 */
export function useCurrentOrder(orderLocalId: string | null) {
  const order = useLiveQuery(
    () => (!isBrowser() ? undefined : orderLocalId ? db.orders.get(orderLocalId) : undefined),
    [orderLocalId]
  );

  const items = useLiveQuery(
    () =>
      !isBrowser()
        ? []
        : orderLocalId
          ? db.orderItems
              .where("orderId")
              .equals(orderLocalId)
              .filter((i) => i.status !== "CANCELLED")
              .toArray()
          : [],
    [orderLocalId],
    []
  );

  const payments = useLiveQuery(
    () =>
      !isBrowser()
        ? []
        : orderLocalId
          ? db.payments.where("orderId").equals(orderLocalId).toArray()
          : [],
    [orderLocalId],
    []
  );

  return { order, items: items ?? [], payments: payments ?? [] };
}

/**
 * Get all open orders — for the orders list page.
 */
export function useOpenOrders() {
  const orders = useLiveQuery(
    () =>
      !isBrowser()
        ? []
        : db.orders
            .where("status")
            .anyOf(["OPEN", "SENT_TO_KITCHEN", "IN_PROGRESS", "READY", "SERVED", "BILL_REQUESTED"])
            .toArray(),
    [],
    []
  );

  return { orders: orders ?? [], isLoading: orders === undefined };
}

/**
 * Get orders for a specific table.
 */
export function useTableOrders(tableId: string | undefined) {
  const orders = useLiveQuery(
    async () => {
      if (!isBrowser() || !tableId) return [];
      return db.orders
        .where("tableId")
        .equals(tableId)
        .filter(o => o.status !== "CLOSED" && o.status !== "CANCELLED")
        .toArray();
    },
    [tableId],
    []
  );

  return { orders: orders ?? [] };
}

/**
 * Get order by local ID or server ID.
 */
export function useOrder(orderId: string | undefined) {
  const order = useLiveQuery(
    async () => {
      if (!isBrowser() || !orderId) return undefined;
      let result = await db.orders.get(orderId);
      if (!result) result = await db.orders.where("_serverId").equals(orderId).first();
      return result;
    },
    [orderId],
    undefined
  );

  return order;
}

/**
 * Get order items for an order.
 */
export function useOrderItems(orderLocalId: string | undefined) {
  const items = useLiveQuery(
    () =>
      !isBrowser() || !orderLocalId
        ? []
        : db.orderItems.where("orderId").equals(orderLocalId).toArray(),
    [orderLocalId],
    []
  );

  return { items: items ?? [], isLoading: items === undefined };
}

/**
 * Sync status — pending operations count.
 */
export function useSyncStatus() {
  const pendingCount = useLiveQuery(() => (!isBrowser() ? 0 : db.syncQueue.count()), [], 0);
  const errorOrders = useLiveQuery(
    () => (!isBrowser() ? 0 : db.orders.where("_syncStatus").equals("error").count()),
    [],
    0
  );

  return { pendingCount: pendingCount ?? 0, errorCount: errorOrders ?? 0 };
}

/**
 * Get all orders (including closed) for reporting.
 */
export function useAllOrders(options?: { limit?: number; status?: readonly LocalOrder["status"][] }) {
  const orders = useLiveQuery(
    async () => {
      if (!isBrowser()) return [];
      const query = db.orders.orderBy("createdAt").reverse();
      if (options?.status && options.status.length > 0) {
        const allOrders = await query.toArray();
        return allOrders
          .filter(o => options.status!.includes(o.status))
          .slice(0, options?.limit ?? 100);
      }
      if (options?.limit) return query.limit(options.limit).toArray();
      return query.toArray();
    },
    [options?.limit, options?.status?.join(",")],
    []
  );

  return { orders: orders ?? [], isLoading: orders === undefined };
}

/**
 * Get order totals reactively.
 */
export function useOrderTotals(orderLocalId: string | null) {
  const totals = useLiveQuery(
    async () => {
      if (!isBrowser() || !orderLocalId) {
        return { itemsTotal: 0, discount: 0, finalTotal: 0, paidTotal: 0, remaining: 0 };
      }

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
    },
    [orderLocalId],
    { itemsTotal: 0, discount: 0, finalTotal: 0, paidTotal: 0, remaining: 0 }
  );

  return totals;
}
