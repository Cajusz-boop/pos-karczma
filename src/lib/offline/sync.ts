"use client";

import { useOfflineStore, type PendingAction, type OfflineActionType } from "@/store/useOfflineStore";

const MAX_RETRIES = 5;
const RETRY_DELAY_BASE_MS = 2000;
const FETCH_TIMEOUT_MS = 10000;
const CONNECTIVITY_CHECK_INTERVAL = 30000;

type EndpointConfig = {
  url: string | ((p: Record<string, unknown>) => string);
  method: string;
};

/**
 * API endpoint mapping for each action type.
 */
const ACTION_ENDPOINTS: Record<OfflineActionType, EndpointConfig> = {
  CREATE_ORDER: { url: "/api/orders", method: "POST" },
  SEND_ORDER: { url: (p) => `/api/orders/${p.orderId}/send`, method: "POST" },
  ADD_PAYMENT: { url: "/api/payments", method: "POST" },
  CLOSE_ORDER: { url: (p) => `/api/orders/${p.orderId}/close`, method: "PATCH" },
  CANCEL_ITEM: { url: (p) => `/api/orders/${p.orderId}/items/${p.itemId}/cancel`, method: "PATCH" },
  CASH_OPERATION: { url: "/api/cash-drawer", method: "POST" },
  UPDATE_ORDER_ITEM: { url: (p) => `/api/orders/${p.orderId}/items/${p.itemId}`, method: "PATCH" },
  ADD_DISCOUNT: { url: (p) => `/api/orders/${p.orderId}/discount`, method: "POST" },
  REMOVE_DISCOUNT: { url: (p) => `/api/orders/${p.orderId}/discount`, method: "DELETE" },
  UPDATE_GUEST_COUNT: { url: (p) => `/api/orders/${p.orderId}/guests`, method: "PATCH" },
  SPLIT_ORDER: { url: (p) => `/api/orders/${p.orderId}/split`, method: "POST" },
  MERGE_ORDER: { url: (p) => `/api/orders/${p.orderId}/merge`, method: "POST" },
  TRANSFER_TABLE: { url: (p) => `/api/orders/${p.orderId}/transfer`, method: "POST" },
  RELEASE_COURSE: { url: (p) => `/api/orders/${p.orderId}/release-course`, method: "POST" },
  RECALL_ITEM: { url: (p) => `/api/orders/${p.orderId}/items/${p.itemId}/recall`, method: "POST" },
  ADD_TIP: { url: "/api/tips", method: "POST" },
  PRINT_RECEIPT: { url: (p) => `/api/orders/${p.orderId}/print`, method: "POST" },
  REQUEST_BILL: { url: (p) => `/api/orders/${p.orderId}/request-bill`, method: "POST" },
};

/**
 * Execute a single pending action against the API with timeout.
 */
async function executeAction(action: PendingAction): Promise<{ success: boolean; error?: string; permanent?: boolean }> {
  const endpoint = ACTION_ENDPOINTS[action.type];
  if (!endpoint) {
    return { success: false, error: `Nieznany typ akcji: ${action.type}`, permanent: true };
  }

  const url = typeof endpoint.url === "function" ? endpoint.url(action.payload) : endpoint.url;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: endpoint.method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action.payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return { success: true };
    }

    const data = await response.json().catch(() => ({}));
    
    const isPermanentError = response.status >= 400 && response.status < 500 && response.status !== 429;
    
    return {
      success: false,
      error: data.error ?? `HTTP ${response.status}`,
      permanent: isPermanentError,
    };
  } catch (e) {
    clearTimeout(timeoutId);
    
    if (e instanceof Error && e.name === "AbortError") {
      return { success: false, error: "Przekroczono limit czasu żądania" };
    }
    
    return {
      success: false,
      error: e instanceof Error ? e.message : "Błąd sieci",
    };
  }
}

/**
 * Check if action has expired.
 */
function isActionExpired(action: PendingAction): boolean {
  if (!action.expiresAt) return false;
  return new Date(action.expiresAt) < new Date();
}

/**
 * Sync all pending actions to the server.
 * Processes actions by priority, then by creation time.
 */
export async function syncPendingActions(): Promise<{
  synced: number;
  failed: number;
  remaining: number;
  permanentlyFailed: number;
}> {
  const store = useOfflineStore.getState();

  if (store.syncInProgress) {
    return { synced: 0, failed: 0, remaining: store.pendingActions.length, permanentlyFailed: 0 };
  }

  if (store.pendingActions.length === 0) {
    return { synced: 0, failed: 0, remaining: 0, permanentlyFailed: 0 };
  }

  store.setSyncInProgress(true);
  let synced = 0;
  let failed = 0;
  let permanentlyFailed = 0;

  try {
    for (const action of [...store.pendingActions]) {
      if (!useOfflineStore.getState().isOnline) {
        break;
      }

      if (isActionExpired(action)) {
        store.markAsFailed({ ...action, lastError: "Akcja wygasła" });
        permanentlyFailed++;
        continue;
      }

      const result = await executeAction(action);

      if (result.success) {
        store.removePendingAction(action.id);
        synced++;
        continue;
      }

      if (result.permanent) {
        store.markAsFailed({ ...action, lastError: result.error });
        permanentlyFailed++;
        continue;
      }

      const newRetryCount = action.retryCount + 1;

      if (newRetryCount >= MAX_RETRIES) {
        store.markAsFailed({
          ...action,
          retryCount: newRetryCount,
          lastError: `Przekroczono limit prób (${MAX_RETRIES}): ${result.error}`,
        });
        permanentlyFailed++;
        continue;
      }

      store.updatePendingAction(action.id, {
        retryCount: newRetryCount,
        lastError: result.error,
      });
      failed++;

      const backoffDelay = RETRY_DELAY_BASE_MS * Math.pow(2, newRetryCount - 1);
      const jitter = Math.random() * 1000;
      await new Promise((r) => setTimeout(r, backoffDelay + jitter));
    }

    store.setLastSyncAt(new Date().toISOString());
  } finally {
    store.setSyncInProgress(false);
  }

  return {
    synced,
    failed,
    remaining: useOfflineStore.getState().pendingActions.length,
    permanentlyFailed,
  };
}

/**
 * Check if the server is reachable with timeout.
 */
export async function checkConnectivity(): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);
  
  try {
    const response = await fetch("/api/ping", {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    clearTimeout(timeoutId);
    return false;
  }
}

/**
 * Initialize offline detection and auto-sync.
 * Call once on app mount.
 */
export function initOfflineSync(): () => void {
  const store = useOfflineStore.getState();

  const handleOnline = () => {
    store.setOnline(true);
    syncPendingActions();
  };

  const handleOffline = () => {
    store.setOnline(false);
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  store.setOnline(navigator.onLine);

  const intervalId = setInterval(async () => {
    const online = await checkConnectivity();
    const wasOffline = !useOfflineStore.getState().isOnline;
    store.setOnline(online);

    if (online && wasOffline) {
      syncPendingActions();
    }
  }, CONNECTIVITY_CHECK_INTERVAL);

  if (navigator.onLine && store.pendingActions.length > 0) {
    setTimeout(() => syncPendingActions(), 2000);
  }

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
    clearInterval(intervalId);
  };
}

/**
 * Get sync status for UI display.
 */
export function getSyncStatus(): {
  pending: number;
  failed: number;
  lastSync: string | null;
  inProgress: boolean;
} {
  const state = useOfflineStore.getState();
  return {
    pending: state.pendingActions.length,
    failed: state.failedPermanently.length,
    lastSync: state.lastSyncAt,
    inProgress: state.syncInProgress,
  };
}
