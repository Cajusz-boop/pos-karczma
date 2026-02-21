"use client";

import { useOfflineStore, type PendingAction } from "@/store/useOfflineStore";

const MAX_RETRIES = 5;
const RETRY_DELAY_BASE_MS = 2000;

/**
 * API endpoint mapping for each action type.
 */
const ACTION_ENDPOINTS: Record<PendingAction["type"], { url: string | ((p: Record<string, unknown>) => string); method: string }> = {
  CREATE_ORDER: { url: "/api/orders", method: "POST" },
  SEND_ORDER: { url: (p) => `/api/orders/${p.orderId}/send`, method: "POST" },
  ADD_PAYMENT: { url: "/api/payments", method: "POST" },
  CLOSE_ORDER: { url: (p) => `/api/orders/${p.orderId}/close`, method: "PATCH" },
  CANCEL_ITEM: { url: (p) => `/api/orders/${p.orderId}/items/${p.itemId}/cancel`, method: "PATCH" },
  CASH_OPERATION: { url: "/api/cash-drawer", method: "POST" },
};

/**
 * Execute a single pending action against the API.
 */
async function executeAction(action: PendingAction): Promise<{ success: boolean; error?: string }> {
  const endpoint = ACTION_ENDPOINTS[action.type];
  if (!endpoint) {
    return { success: false, error: `Nieznany typ akcji: ${action.type}` };
  }

  const url = typeof endpoint.url === "function" ? endpoint.url(action.payload) : endpoint.url;

  try {
    const response = await fetch(url, {
      method: endpoint.method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action.payload),
    });

    if (response.ok) {
      return { success: true };
    }

    const data = await response.json().catch(() => ({}));
    return {
      success: false,
      error: data.error ?? `HTTP ${response.status}`,
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Błąd sieci",
    };
  }
}

/**
 * Sync all pending actions to the server.
 * Processes actions in order (FIFO).
 * Stops on first failure to maintain order consistency.
 */
export async function syncPendingActions(): Promise<{
  synced: number;
  failed: number;
  remaining: number;
}> {
  const store = useOfflineStore.getState();

  if (store.syncInProgress) {
    return { synced: 0, failed: 0, remaining: store.pendingActions.length };
  }

  if (store.pendingActions.length === 0) {
    return { synced: 0, failed: 0, remaining: 0 };
  }

  store.setSyncInProgress(true);
  let synced = 0;
  let failed = 0;

  try {
    for (const action of [...store.pendingActions]) {
      if (!useOfflineStore.getState().isOnline) {
        break;
      }

      const result = await executeAction(action);

      if (result.success) {
        store.removePendingAction(action.id);
        synced++;
      } else {
        const newRetryCount = action.retryCount + 1;

        if (newRetryCount >= MAX_RETRIES) {
          // Max retries exceeded — keep in queue with error
          store.updatePendingAction(action.id, {
            retryCount: newRetryCount,
            lastError: `Max retries (${MAX_RETRIES}): ${result.error}`,
          });
          failed++;
          // Don't stop — try next action
          continue;
        }

        store.updatePendingAction(action.id, {
          retryCount: newRetryCount,
          lastError: result.error,
        });
        failed++;

        // Exponential backoff delay before next retry
        await new Promise((r) => setTimeout(r, RETRY_DELAY_BASE_MS * Math.pow(2, newRetryCount - 1)));
      }
    }

    store.setLastSyncAt(new Date().toISOString());
  } finally {
    store.setSyncInProgress(false);
  }

  return {
    synced,
    failed,
    remaining: useOfflineStore.getState().pendingActions.length,
  };
}

/**
 * Check if the server is reachable.
 * Uses /api/ping (edge runtime) for minimal latency.
 */
export async function checkConnectivity(): Promise<boolean> {
  try {
    const response = await fetch("/api/ping", {
      method: "HEAD",
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Initialize offline detection and auto-sync.
 * Call once on app mount.
 */
export function initOfflineSync(): () => void {
  const store = useOfflineStore.getState();

  // Listen for online/offline events
  const handleOnline = () => {
    store.setOnline(true);
    // Auto-sync when coming back online
    syncPendingActions();
  };

  const handleOffline = () => {
    store.setOnline(false);
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  // Set initial state
  store.setOnline(navigator.onLine);

  // Periodic connectivity check (every 30s)
  const intervalId = setInterval(async () => {
    const online = await checkConnectivity();
    const wasOffline = !useOfflineStore.getState().isOnline;
    store.setOnline(online);

    if (online && wasOffline) {
      syncPendingActions();
    }
  }, 30000);

  // Auto-sync on startup if online and has pending actions
  if (navigator.onLine && store.pendingActions.length > 0) {
    setTimeout(() => syncPendingActions(), 2000);
  }

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
    clearInterval(intervalId);
  };
}
