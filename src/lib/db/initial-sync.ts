import { db, type LocalOrder, type LocalOrderItem } from "./offline-db";
import { safeFetch } from "@/lib/utils/safe-fetch";
import { getApiBaseUrl } from "@/lib/utils/get-api-base";

// rooms + tables na początku — krytyczne dla POS, małe tabele; products (duża) na końcu
const SYNC_TABLES = [
  "categories",
  "rooms",
  "tables",
  "modifiers",
  "tax-rates",
  "allergens",
  "products",
] as const;

type SyncTable = (typeof SYNC_TABLES)[number];

interface SyncPullResponse<T> {
  data: T[];
  serverTimestamp: string;
  hasMore: boolean;
}

const SYNC_TIMEOUT_MS = 30000; // 30s — na chmurze sync może trwać dłużej
const SYNC_RETRY_TABLES = ["tables", "rooms"] as const; // Krytyczne dla POS — retry przy błędzie

async function fetchTable<T>(
  table: SyncTable,
  since?: string,
  attempt = 1
): Promise<SyncPullResponse<T>> {
  if (typeof window === "undefined") throw new Error("fetchTable is client-only");
  const base = await getApiBaseUrl();
  const url = new URL(`/api/sync/pull`, base);
  url.searchParams.set("table", table);
  if (since) url.searchParams.set("since", since);

  const { data, error, offline } = await safeFetch<SyncPullResponse<T>>(
    url.toString(),
    { credentials: "include" },
    { timeoutMs: SYNC_TIMEOUT_MS }
  );

  if (offline) throw new Error(`Sync pull failed for ${table}: offline`);
  if (error || !data) {
    const errMsg = `Sync pull failed for ${table}: ${error ?? "invalid response"}`;
    const shouldRetry =
      attempt < 3 &&
      (SYNC_RETRY_TABLES as readonly string[]).includes(table) &&
      !error?.includes("401");
    if (shouldRetry) {
      await new Promise((r) => setTimeout(r, 2000));
      return fetchTable<T>(table, since, attempt + 1);
    }
    throw new Error(errMsg);
  }
  return data;
}

/**
 * Full initial sync — run on app start.
 * Downloads all reference data to Dexie.
 */
export async function initialSync(): Promise<{
  tables: Record<string, number>;
  errors: string[];
}> {
  const results: Record<string, number> = {};
  const errors: string[] = [];

  for (const table of SYNC_TABLES) {
    try {
      const checkpoint = await db.syncCheckpoints.get(table);
      let since = checkpoint?.lastServerTimestamp;
      let totalRecords = 0;

      // P18-FIX: Paginacja — pobieraj dopóki hasMore === true
      let hasMore = true;
      while (hasMore) {
        const response = await fetchTable(table, since);

        if (response.data.length === 0) break;

        await db.transaction("rw", getTableRef(table), db.syncCheckpoints, async () => {
          const dexieTable = getTableRef(table);

          if (!since && totalRecords === 0) {
            // Full sync (first page) — clear and replace
            await dexieTable.clear();
          }

          await (dexieTable as { bulkPut: (items: unknown[]) => Promise<unknown> }).bulkPut(response.data);
        });

        totalRecords += response.data.length;
        since = response.serverTimestamp;
        hasMore = response.hasMore;
      }

      // Save checkpoint after all pages
      await db.syncCheckpoints.put({
        id: table,
        lastSyncAt: new Date().toISOString(),
        lastServerTimestamp: since ?? undefined,
        recordCount: await getTableRef(table).count(),
      });

      results[table] = totalRecords;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${table}: ${msg}`);
      console.error(`[InitialSync] Error syncing ${table}:`, e);
    }
  }

  return { tables: results, errors };
}

function getTableRef(table: SyncTable) {
  switch (table) {
    case "products": return db.products;
    case "categories": return db.categories;
    case "rooms": return db.rooms;
    case "tables": return db.posTables;
    case "modifiers": return db.modifierGroups;
    case "tax-rates": return db.taxRates;
    case "allergens": return db.allergens;
  }
}

/**
 * Background refresh — call every 5 min.
 * Only fetches records updated since last sync.
 */
export async function backgroundRefresh(): Promise<void> {
  try {
    await initialSync();
  } catch (e) {
    console.warn("[BackgroundRefresh] Failed:", e);
  }
}

interface OpenOrdersSyncResponse {
  orders: LocalOrder[];
  items: LocalOrderItem[];
  serverTimestamp: string;
}

/**
 * Sync open orders from server to Dexie.
 * Call on POS page load to ensure local DB has all active orders.
 * This prevents "table occupied" errors when orders exist on server but not locally.
 */
export async function syncOpenOrders(): Promise<{ orders: number; items: number }> {
  if (typeof window === "undefined") {
    return { orders: 0, items: 0 };
  }

  try {
    const base = await getApiBaseUrl();
    const url = `${base}/api/sync/open-orders`;

    const { data, error, offline } = await safeFetch<OpenOrdersSyncResponse>(
      url,
      { credentials: "include" },
      { timeoutMs: SYNC_TIMEOUT_MS }
    );
    
    if (offline) {
      console.warn("[SyncOpenOrders] Offline, skipping sync");
      return { orders: 0, items: 0 };
    }
    
    if (error || !data) {
      console.error("[SyncOpenOrders] Failed:", error);
      return { orders: 0, items: 0 };
    }

    const { orders, items } = data;

    await db.transaction("rw", [db.orders, db.orderItems, db.posTables], async () => {
      // Upsert orders - check by _serverId to avoid duplicates
      for (const order of orders) {
        const existing = await db.orders.where("_serverId").equals(order._serverId!).first();
        if (existing) {
          // Update existing order (server is source of truth for synced orders)
          await db.orders.update(existing._localId, {
            ...order,
            _localId: existing._localId, // Keep original localId
            _syncStatus: "synced",
          });
        } else {
          // Add new order from server
          await db.orders.add(order);
        }

        // Update table status if order has a table
        if (order.tableId && order.status !== "CLOSED" && order.status !== "CANCELLED") {
          const tableStatus = order.status === "BILL_REQUESTED" ? "BILL_REQUESTED" : "OCCUPIED";
          await db.posTables.update(order.tableId, { status: tableStatus }).catch(() => {});
        }
      }

      // Upsert items
      for (const item of items) {
        const existing = await db.orderItems.where("_serverId").equals(item._serverId!).first();
        if (existing) {
          await db.orderItems.update(existing._localId, {
            ...item,
            _localId: existing._localId,
            _syncStatus: "synced",
          });
        } else {
          await db.orderItems.add(item);
        }
      }
    });

    console.log(`[SyncOpenOrders] Synced ${orders.length} orders, ${items.length} items`);
    return { orders: orders.length, items: items.length };
  } catch (e) {
    console.error("[SyncOpenOrders] Error:", e);
    return { orders: 0, items: 0 };
  }
}
