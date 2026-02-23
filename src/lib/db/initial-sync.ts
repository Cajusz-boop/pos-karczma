import { db } from "./offline-db";
import { safeFetch } from "@/lib/utils/safe-fetch";

const SYNC_TABLES = [
  "products",
  "categories",
  "rooms",
  "tables",
  "modifiers",
  "tax-rates",
  "allergens",
] as const;

type SyncTable = (typeof SYNC_TABLES)[number];

interface SyncPullResponse<T> {
  data: T[];
  serverTimestamp: string;
  hasMore: boolean;
}

async function fetchTable<T>(table: SyncTable, since?: string): Promise<SyncPullResponse<T>> {
  if (typeof window === "undefined") throw new Error("fetchTable is client-only");
  const url = new URL(`/api/sync/pull`, window.location.origin);
  url.searchParams.set("table", table);
  if (since) url.searchParams.set("since", since);

  const { data, error, offline } = await safeFetch<SyncPullResponse<T>>(url.toString());
  if (offline) throw new Error(`Sync pull failed for ${table}: offline`);
  if (error || !data) throw new Error(`Sync pull failed for ${table}: ${error ?? "invalid response"}`);
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
