import { db, type SyncQueueItem } from "@/lib/db/offline-db";
import { safeFetch } from "@/lib/utils/safe-fetch";

// ============================================================
// CONFIGURATION
// ============================================================

const SYNC_CONFIG = {
  maxRetries: 8,
  batchSize: 20,
  retryDelays: [1000, 3000, 10000, 30000, 60000, 120000, 300000, 600000],
  batchEndpoint: "/api/sync/batch",
  jitterMaxMs: 2000, // losowe opóźnienie przy masowym sync
};

// ============================================================
// TYPES
// ============================================================

interface SyncResult {
  synced: number;
  failed: number;
  pending: number;
}

interface SyncStatus {
  state: "idle" | "syncing" | "pending" | "error";
  pending?: number;
  lastSync?: string;
}

interface BatchResult {
  queueId: number;
  success: boolean;
  serverId?: string;
  serverVersion?: number;
  error?: string;
  // Fiscal/receipt response
  receiptUrl?: string;
  receiptQrData?: string;
  fiscalNumber?: string;
}

// ============================================================
// SYNC ENGINE
// ============================================================

class SyncEngine {
  private isRunning = false;
  private listeners: Array<(status: SyncStatus) => void> = [];

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        // Jitter — nie wszystkie telefony kelnerów syncują jednocześnie
        const jitter = Math.random() * SYNC_CONFIG.jitterMaxMs;
        setTimeout(() => this.pushNow(), jitter);
      });
    }
  }

  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(status: SyncStatus) {
    this.listeners.forEach((l) => l(status));
  }

  // P5-FIX: Push loop — synkuj dopóki kolejka nie jest pusta
  async pushNow(): Promise<SyncResult> {
    if (this.isRunning || !navigator.onLine) {
      const pending = await db.syncQueue.count();
      return { synced: 0, failed: 0, pending };
    }

    this.isRunning = true;
    this.notify({ state: "syncing" });
    let totalSynced = 0;
    let totalFailed = 0;

    try {
      while (navigator.onLine) {
        const items = await db.syncQueue
          .orderBy("[priority+timestamp]")
          .filter((item) => this.shouldAttempt(item))
          .limit(SYNC_CONFIG.batchSize)
          .toArray();

        if (items.length === 0) break;

        // P7-FIX: Priority = naturalny porządek zależności
        // orders: 3 (first), orderItems: 2, payments: 1 (last)
        items.sort((a, b) => {
          if (a.priority !== b.priority) return b.priority - a.priority;
          return a.timestamp.localeCompare(b.timestamp);
        });

        // Filter by dependencies
        const ready = await this.filterByDependencies(items);
        if (ready.length === 0) {
          break;
        }

        // Resolve parent server IDs
        const operations = await Promise.all(
          ready.map(async (item) => {
            let parentServerId: string | undefined;
            if (item.table === "orderItems" || item.table === "payments") {
              const orderId = item.data.orderId as string;
              const order = await db.orders.get(orderId);
              parentServerId = order?._serverId;
            }
            return {
              queueId: item.id!,
              operationId: item.operationId,
              operation: item.operation,
              table: item.table,
              localId: item.localId,
              parentServerId,
              data: item.data,
              timestamp: item.timestamp,
            };
          })
        );

        // Send batch
        const base = typeof window !== "undefined" ? window.location.origin : "";
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        const { data: results, error, offline } = await safeFetch<BatchResult[]>(
          `${base}${SYNC_CONFIG.batchEndpoint}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ operations }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);

        if (offline || error || !results) throw new Error(error ?? "Sync failed");

        let synced = 0;
        let failed = 0;

        // Process results in transaction
        await db.transaction("rw", [db.orders, db.orderItems, db.payments, db.syncQueue], async () => {
          for (const result of results) {
            const item = ready.find((i) => i.id === result.queueId);
            if (!item) continue;

            if (result.success) {
              // Update local record with server data
              const tableRef = db[item.table];
              await tableRef.update(item.localId, {
                _serverId: result.serverId,
                _serverVersion: result.serverVersion,
                _syncStatus: "synced",
                _syncedAt: new Date().toISOString(),
                _syncError: undefined,
                // Payment-specific fields from fiscal response
                ...(result.receiptUrl && { receiptUrl: result.receiptUrl, receiptQrData: result.receiptQrData }),
                ...(result.fiscalNumber && { fiscalNumber: result.fiscalNumber, fiscalStatus: "fiscalized" }),
                ...(result.receiptUrl && { receiptStatus: "generated" }),
              } as never);

              // Propagate serverId to children
              if (item.table === "orders" && result.serverId) {
                await db.orderItems.where("orderId").equals(item.localId).modify({ orderServerId: result.serverId });
                await db.payments.where("orderId").equals(item.localId).modify({ orderServerId: result.serverId });
              }

              await db.syncQueue.delete(item.id!);
              synced++;
            } else {
              const newRetries = item.retries + 1;
              await db.syncQueue.update(item.id!, {
                retries: newRetries,
                lastAttemptAt: new Date().toISOString(),
                lastError: result.error || "Unknown error",
              });

              if (newRetries >= SYNC_CONFIG.maxRetries) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (db[item.table] as any).update(item.localId, {
                  _syncStatus: "error",
                  _syncError: result.error,
                });
              }
              failed++;
            }
          }
        });

        totalSynced += synced;
        totalFailed += failed;
      } // end while loop (P5-FIX)
    } catch (e) {
      console.error("[SyncEngine] Batch failed:", e);
      totalFailed++;
    } finally {
      this.isRunning = false;
      const pending = await db.syncQueue.count();
      this.notify({
        state: pending > 0 ? "pending" : "idle",
        pending,
        lastSync: new Date().toISOString(),
      });
    }

    return { synced: totalSynced, failed: totalFailed, pending: await db.syncQueue.count() };
  }

  async forceSyncOrder(orderLocalId: string): Promise<boolean> {
    if (!navigator.onLine) return false;

    const order = await db.orders.get(orderLocalId);
    if (!order) return false;
    if (order._syncStatus === "synced" && order._serverId) return true;

    await this.pushNow();

    const updated = await db.orders.get(orderLocalId);
    return updated?._syncStatus === "synced" && !!updated._serverId;
  }

  private shouldAttempt(item: SyncQueueItem): boolean {
    if (item.retries >= SYNC_CONFIG.maxRetries) return false;
    if (!item.lastAttemptAt) return true;

    const delay = SYNC_CONFIG.retryDelays[Math.min(item.retries, SYNC_CONFIG.retryDelays.length - 1)];
    const nextAttempt = new Date(item.lastAttemptAt).getTime() + delay;
    return Date.now() >= nextAttempt;
  }

  private async filterByDependencies(items: SyncQueueItem[]): Promise<SyncQueueItem[]> {
    const ready: SyncQueueItem[] = [];
    for (const item of items) {
      if (!item.dependsOn?.length) {
        ready.push(item);
        continue;
      }
      const allSynced = await Promise.all(
        item.dependsOn.map(async (depId) => {
          const order = await db.orders.get(depId);
          return order?._syncStatus === "synced" && !!order._serverId;
        })
      );
      if (allSynced.every(Boolean)) ready.push(item);
    }
    return ready;
  }
}

// ============================================================
// HELPER: Queue operation
// ============================================================

export async function queueOperation(
  operation: "CREATE" | "UPDATE" | "DELETE",
  table: "orders" | "orderItems" | "payments",
  localId: string,
  data: Record<string, unknown>,
  dependsOn?: string[]
): Promise<void> {
  // P7-FIX: Priority = naturalny porządek zależności
  // orders first (3), items second (2), payments last (1)
  // To gwarantuje że parent jest syncowany przed dziećmi
  const priority = table === "orders" ? 3 : table === "orderItems" ? 2 : 1;

  await db.syncQueue.add({
    operationId: crypto.randomUUID(), // Idempotency key
    operation,
    table,
    localId,
    data,
    timestamp: new Date().toISOString(),
    retries: 0,
    priority,
    dependsOn,
  });

  // Debounced trigger
  if (navigator.onLine) {
    setTimeout(() => syncEngine.pushNow(), 150);
  }
}

// ============================================================
// SINGLETON
// ============================================================

export const syncEngine = new SyncEngine();
