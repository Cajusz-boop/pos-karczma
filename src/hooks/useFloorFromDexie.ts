import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type LocalOrder, type LocalOrderItem, type LocalRoom, type LocalTable } from "@/lib/db/offline-db";
import { useDexieSyncReady } from "@/components/providers/DexieProvider";

const isBrowser = () => typeof window !== "undefined";

type RawFloorData = {
  allRoomsRaw: Awaited<ReturnType<typeof db.rooms.toArray>>;
  allTables: Awaited<ReturnType<typeof db.posTables.toArray>>;
  allOrders: Awaited<ReturnType<typeof db.orders.toArray>>;
  allOrderItems: Awaited<ReturnType<typeof db.orderItems.toArray>>;
};

type TableShape = "RECTANGLE" | "ROUND" | "LONG";
type TableStatus = "FREE" | "OCCUPIED" | "BILL_REQUESTED" | "RESERVED" | "BANQUET_MODE" | "INACTIVE";

export interface KitchenStatus {
  ordered: number;
  inProgress: number;
  ready: number;
  served: number;
}

export interface Timing {
  minutesSinceCreated: number;
  minutesSinceLastInteraction: number;
  minutesSinceLastKitchenEvent: number | null;
}

export interface TableView {
  id: string;
  number: number;
  seats: number;
  shape: TableShape;
  status: TableStatus;
  positionX: number;
  positionY: number;
  assignedUserId: string | null;
  assignedUserName: string | null;
  assignedUserInitials: string | null;
  activeOrder: {
    id: string;
    orderNumber: number;
    orderNumberLabel?: string; // "L-123" when pending, else undefined
    createdAt: string;
    totalGross: number;
    itemCount: number;
    guestCount: number;
    userId: string;
    userName: string;
  } | null;
  kitchenStatus: KitchenStatus | null;
  timing: Timing | null;
  nextReservation: {
    id: string;
    timeFrom: string;
    guestName: string;
    guestCount: number;
    minutesUntil: number;
  } | null;
  needsAttention: boolean;
  hasKitchenAlert: boolean;
}

export interface RoomView {
  id: string;
  name: string;
  capacity: number;
  type: string;
  tables: TableView[];
  stats: {
    total: number;
    free: number;
    occupied: number;
    billRequested: number;
    reserved: number;
    withAlerts: number;
    totalRevenue: number;
  };
}

/**
 * Build floor (rooms + tables + orders) from Dexie for offline POS.
 * useLiveQuery z pustym deps [] — reaguje TYLKO na zmiany w Dexie.
 * syncReady sprawdzamy poza useLiveQuery (useLiveQuery nie re-runuje gdy zmieniają się zewnętrzne deps).
 */
export function useFloorFromDexie(): { rooms: RoomView[]; isLoading: boolean } {
  const syncReady = useDexieSyncReady();

  const rawData = useLiveQuery(
    async (): Promise<RawFloorData | null> => {
      if (!isBrowser()) return null;
      const [allRoomsRaw, allTables, allOrders, allOrderItems] = await Promise.all([
        db.rooms.toArray(),
        db.posTables.toArray(),
        db.orders.toArray(),
        db.orderItems.toArray(),
      ]);
      return { allRoomsRaw, allTables, allOrders, allOrderItems };
    },
    [],
    null
  );

  const rooms = useMemo((): RoomView[] => {
    if (!rawData) return [];
    const data = rawData as RawFloorData;
    const allRoomsRaw = data.allRoomsRaw as LocalRoom[];
    const allTables = data.allTables as LocalTable[];
    const allOrders = data.allOrders as LocalOrder[];
    const allOrderItems = data.allOrderItems as LocalOrderItem[];

    const openStatuses = new Set<string>(["OPEN", "SENT_TO_KITCHEN", "IN_PROGRESS", "READY", "SERVED", "BILL_REQUESTED"]);
    const openOrders = allOrders.filter((o) => openStatuses.has(o.status));

    const active = (v: unknown) => v === true || v === 1;
    const allRooms = allRoomsRaw
      .filter((r) => active(r.isActive))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const ordersByTable = new Map<string, (typeof openOrders)[0]>();
    for (const o of openOrders) {
      if (o.tableId) {
        const existing = ordersByTable.get(o.tableId);
        if (!existing || new Date(o.createdAt) > new Date(existing.createdAt)) {
          ordersByTable.set(o.tableId, o);
        }
      }
    }

    const itemsByOrder = new Map<string, (typeof allOrderItems)[0][]>();
    for (const i of allOrderItems) {
      if (!itemsByOrder.has(i.orderId)) itemsByOrder.set(i.orderId, []);
      itemsByOrder.get(i.orderId)!.push(i);
    }

    const now = Date.now();

    return allRooms.map((room) => {
      const roomTables = allTables
        .filter((t) => t.roomId === room.id && active(t.isAvailable))
        .sort((a, b) => a.number - b.number);

      let free = 0,
        occupied = 0,
        billRequested = 0,
        reserved = 0,
        withAlerts = 0;
      let totalRevenue = 0;

      const tables: TableView[] = roomTables.map((t) => {
        const order = ordersByTable.get(t.id) ?? null;
        const items = order ? itemsByOrder.get(order._localId) ?? [] : [];

        // P22-FIX: Compute effective status from actual orders, not stored table.status
        // This prevents stale data from server sync overwriting local changes
        let effectiveStatus: TableStatus = t.status;
        if (order) {
          // If there's an active order, table is occupied (or bill_requested if order status matches)
          effectiveStatus = order.status === "BILL_REQUESTED" ? "BILL_REQUESTED" : "OCCUPIED";
        } else if (t.status === "OCCUPIED" || t.status === "BILL_REQUESTED") {
          // No active order but table marked as occupied - it should be FREE
          // (stale status from server sync before order close propagated)
          effectiveStatus = "FREE";
        }

        if (effectiveStatus === "FREE") free++;
        else if (effectiveStatus === "OCCUPIED") occupied++;
        else if (effectiveStatus === "BILL_REQUESTED") billRequested++;
        else if (effectiveStatus === "RESERVED") reserved++;

        let kitchenStatus: KitchenStatus | null = null;
        let hasKitchenAlert = false;
        if (items.length > 0) {
          const counts = { ordered: 0, inProgress: 0, ready: 0, served: 0 };
          for (const item of items) {
            if (item.status === "CANCELLED") continue;
            if (item.status === "ORDERED" || item.status === "SENT") counts.ordered++;
            else if (item.status === "IN_PROGRESS") counts.inProgress++;
            else if (item.status === "READY") counts.ready++;
            else if (item.status === "SERVED") counts.served++;
          }
          kitchenStatus = counts;
          hasKitchenAlert = counts.ready > 0;
          if (hasKitchenAlert) withAlerts++;
        }

        if (order) totalRevenue += order.totalGross ?? 0;

        let timing: Timing | null = null;
        if (order) {
          const createdAt = new Date(order.createdAt).getTime();
          const lastInteraction = order._updatedAt ? new Date(order._updatedAt).getTime() : createdAt;
          const readyItems = items.filter((i) => i.readyAt).map((i) => new Date(i.readyAt!).getTime());
          const lastKitchenEvent = readyItems.length ? Math.max(...readyItems) : null;

          timing = {
            minutesSinceCreated: Math.floor((now - createdAt) / 60000),
            minutesSinceLastInteraction: Math.floor((now - lastInteraction) / 60000),
            minutesSinceLastKitchenEvent: lastKitchenEvent
              ? Math.floor((now - lastKitchenEvent) / 60000)
              : null,
          };
        }

        const orderIdForNav = order?._serverId ?? order?._localId ?? "";

        return {
          id: t.id,
          number: t.number,
          seats: t.seats,
          shape: t.shape,
          status: effectiveStatus,
          positionX: t.positionX,
          positionY: t.positionY,
          assignedUserId: order?.userId ?? null,
          assignedUserName: order?.userName ?? null,
          assignedUserInitials: order?.userName
            ? order.userName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
            : null,
          activeOrder: order
            ? {
                id: orderIdForNav,
                orderNumber: order.orderNumber ?? 0,
                orderNumberLabel:
                  order._syncStatus === "pending" && order.orderNumber ? `L-${order.orderNumber}` : undefined,
                createdAt: order.createdAt,
                totalGross: order.totalGross ?? 0,
                itemCount: order.itemCount ?? 0,
                guestCount: order.guestCount ?? 0,
                userId: order.userId,
                userName: order.userName ?? "",
              }
            : null,
          kitchenStatus,
          timing,
          nextReservation: null,
          needsAttention: false,
          hasKitchenAlert,
        };
      });

      return {
        id: room.id,
        name: room.name,
        capacity: room.capacity,
        type: room.type,
        tables,
        stats: {
          total: tables.length,
          free,
          occupied,
          billRequested,
          reserved,
          withAlerts,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
        },
      };
    });
  }, [rawData]);

  return {
    rooms,
    isLoading: !syncReady || rawData === undefined,
  };
}
