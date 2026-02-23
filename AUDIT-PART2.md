# AUDIT-PART2.md — Szczegółowy audyt offline, płatności i fiskalizacji

## 1. src/lib/offline/sync.ts

```typescript
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
```

---

## 2. src/lib/fiscal/posnet-driver.ts

```typescript
/**
 * Driver Posnet — warstwa abstrakcji nad drukarką fiskalną Posnet (protokół thermal).
 *
 * Obsługuje dwa tryby:
 * - DEMO: symulacja bez fizycznej drukarki (domyślny)
 * - LIVE: komunikacja z prawdziwą drukarką Posnet (TCP/COM/USB)
 *
 * Konfiguracja w SystemConfig (klucz: "fiscal_printer"):
 * { mode: "DEMO"|"LIVE", connectionType: "TCP"|"COM"|"USB", address: "192.168.1.100", port: 9100 }
 */

import type {
  ReceiptPayload,
  FiscalStatus,
  PrintReceiptResult,
  DailyReportResult,
  FiscalPrinterConfig,
} from "./types";

const RECEIPT_NAME_MAX_LEN = 40;
const DEFAULT_TCP_PORT = 9100;
const COMMAND_TIMEOUT_MS = 10000;

function truncateName(name: string): string {
  if (name.length <= RECEIPT_NAME_MAX_LEN) return name;
  return name.slice(0, RECEIPT_NAME_MAX_LEN - 2) + "..";
}

/**
 * Formatuje pozycję paragonu (nazwa max 40 znaków, qty, cena, stawka VAT).
 */
export function formatReceiptLines(payload: ReceiptPayload): string[] {
  const lines: string[] = [];
  for (const item of payload.items) {
    const name = truncateName(item.name);
    lines.push(`${name} ${item.quantity}×${item.unitPrice.toFixed(2)} [${item.vatSymbol}]`);
  }
  if (payload.discountAmount && payload.discountAmount > 0) {
    lines.push(`Rabat: -${payload.discountAmount.toFixed(2)} zł`);
  }
  for (const p of payload.payments) {
    lines.push(`Płatność ${p.method}: ${p.amount.toFixed(2)} zł`);
  }
  if (payload.buyerNip?.trim()) {
    lines.push(`NIP: ${payload.buyerNip.trim()}`);
  }
  return lines;
}

/**
 * Generuje numer fiskalny w trybie DEMO (bez drukarki).
 */
function generateDemoFiscalNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const time = now.toTimeString().slice(0, 8).replace(/:/g, "");
  const rnd = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `FP-${date}-${time}-${rnd}`;
}

/**
 * Pobiera konfigurację drukarki z SystemConfig.
 * Domyślnie: tryb DEMO.
 */
async function getConfig(): Promise<FiscalPrinterConfig> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const config = await prisma.systemConfig.findUnique({
      where: { key: "fiscal_printer" },
    });
    if (config?.value && typeof config.value === "object") {
      return config.value as unknown as FiscalPrinterConfig;
    }
  } catch (e) {
    console.error("[Posnet] Error reading config:", e);
  }
  return { mode: "DEMO", connectionType: "TCP" };
}

/**
 * Wysyła komendę do drukarki Posnet przez TCP.
 * W trybie LIVE: nawiązuje połączenie TCP, wysyła dane, czeka na odpowiedź.
 * Placeholder — docelowo implementacja pełnego protokołu Posnet thermal.
 */
async function sendTcpCommand(
  address: string,
  port: number,
  command: string
): Promise<{ success: boolean; response?: string; error?: string }> {
  try {
    const net = await import("net");
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let responseData = "";
      const timeout = setTimeout(() => {
        socket.destroy();
        resolve({ success: false, error: "Timeout połączenia z drukarką" });
      }, COMMAND_TIMEOUT_MS);

      socket.connect(port, address, () => {
        socket.write(command);
      });

      socket.on("data", (data) => {
        responseData += data.toString();
      });

      socket.on("end", () => {
        clearTimeout(timeout);
        resolve({ success: true, response: responseData });
      });

      socket.on("error", (err) => {
        clearTimeout(timeout);
        resolve({ success: false, error: `Błąd połączenia: ${err.message}` });
      });
    });
  } catch (e) {
    return {
      success: false,
      error: `Błąd TCP: ${e instanceof Error ? e.message : "Unknown"}`,
    };
  }
}

/**
 * Driver Posnet — automatycznie wybiera tryb DEMO lub LIVE na podstawie konfiguracji.
 */
export const posnetDriver = {
  async getStatus(): Promise<FiscalStatus> {
    const config = await getConfig();

    if (config.mode === "DEMO") {
      return {
        ok: true,
        connected: true,
        message: "Tryb DEMO — drukarka symulowana",
        mode: "DEMO",
      };
    }

    // LIVE mode — test connection
    if (config.connectionType === "TCP" && config.address) {
      const result = await sendTcpCommand(
        config.address,
        config.port ?? DEFAULT_TCP_PORT,
        "\x1B#s" // Posnet status command (ENQ)
      );
      return {
        ok: result.success,
        connected: result.success,
        message: result.success
          ? `Połączono z ${config.address}:${config.port ?? DEFAULT_TCP_PORT} (${config.model ?? "Posnet"})`
          : result.error ?? "Brak połączenia",
        mode: "LIVE",
      };
    }

    // COM/USB — placeholder
    return {
      ok: false,
      connected: false,
      message: `Tryb ${config.connectionType} — wymaga konfiguracji sterownika`,
      mode: "LIVE",
    };
  },

  async printReceipt(payload: ReceiptPayload): Promise<PrintReceiptResult> {
    const config = await getConfig();
    const lines = formatReceiptLines(payload);

    if (config.mode === "DEMO") {
      console.log("[Posnet DEMO] Paragon #" + payload.orderNumber, lines);
      return { success: true, fiscalNumber: generateDemoFiscalNumber() };
    }

    // LIVE mode — send receipt to printer
    if (config.connectionType === "TCP" && config.address) {
      // Build Posnet thermal protocol command for receipt
      // This is a simplified placeholder — real implementation needs full Posnet protocol
      const command = buildReceiptCommand(payload);
      const result = await sendTcpCommand(
        config.address,
        config.port ?? DEFAULT_TCP_PORT,
        command
      );
      if (result.success) {
        // Parse fiscal number from response
        const fiscalNumber = parseFiscalNumber(result.response ?? "") || generateDemoFiscalNumber();
        return { success: true, fiscalNumber };
      }
      return { success: false, error: result.error };
    }

    return { success: false, error: "Drukarka nie skonfigurowana" };
  },

  async printDailyReport(): Promise<DailyReportResult> {
    const config = await getConfig();

    if (config.mode === "DEMO") {
      console.log("[Posnet DEMO] Raport dobowy");
      return { success: true };
    }

    if (config.connectionType === "TCP" && config.address) {
      // Posnet daily report command
      const result = await sendTcpCommand(
        config.address,
        config.port ?? DEFAULT_TCP_PORT,
        "\x1B#r" // Posnet daily report command
      );
      return {
        success: result.success,
        error: result.success ? undefined : result.error,
      };
    }

    return { success: false, error: "Drukarka nie skonfigurowana" };
  },

  async printPeriodReport(dateFrom: string, dateTo: string): Promise<DailyReportResult> {
    const config = await getConfig();

    if (config.mode === "DEMO") {
      console.log(`[Posnet DEMO] Raport okresowy ${dateFrom} - ${dateTo}`);
      return { success: true };
    }

    if (config.connectionType === "TCP" && config.address) {
      const result = await sendTcpCommand(
        config.address,
        config.port ?? DEFAULT_TCP_PORT,
        `\x1B#p${dateFrom}${dateTo}` // Posnet period report command
      );
      return {
        success: result.success,
        error: result.success ? undefined : result.error,
      };
    }

    return { success: false, error: "Drukarka nie skonfigurowana" };
  },
};

/**
 * Build Posnet thermal protocol receipt command.
 * Placeholder — real implementation needs full Posnet protocol specification.
 */
function buildReceiptCommand(payload: ReceiptPayload): string {
  const lines = formatReceiptLines(payload);
  // Simplified: send formatted text to printer
  return lines.join("\n") + "\n\x1D\x56\x00"; // Cut paper command
}

/**
 * Parse fiscal number from Posnet printer response.
 */
function parseFiscalNumber(response: string): string | null {
  // Look for fiscal number pattern in response
  const match = response.match(/FP[-/]\d+/);
  return match ? match[0] : null;
}
```

---

## 3. src/lib/fiscal/types.ts

```typescript
/**
 * Typy dla modułu fiskalnego (Posnet / paragony).
 */

export interface ReceiptItemPayload {
  /** Nazwa pozycji (max 40 znaków dla Posnet) */
  name: string;
  quantity: number;
  unitPrice: number;
  /** Symbol stawki VAT: A, B, C, D, E */
  vatSymbol: string;
}

export interface ReceiptPaymentPayload {
  method: string;
  amount: number;
}

export interface ReceiptPayload {
  orderNumber: number;
  items: ReceiptItemPayload[];
  payments: ReceiptPaymentPayload[];
  discountAmount?: number;
  /** NIP nabywcy na paragonie (opcjonalnie) */
  buyerNip?: string;
}

export interface FiscalStatus {
  ok: boolean;
  connected: boolean;
  message?: string;
  /** Ostatni numer fiskalny (jeśli dostępny) */
  lastFiscalNumber?: string;
  /** Tryb pracy (DEMO lub LIVE) */
  mode?: "DEMO" | "LIVE";
}

export interface PrintReceiptResult {
  success: boolean;
  fiscalNumber?: string;
  error?: string;
}

export interface DailyReportResult {
  success: boolean;
  error?: string;
}

/** Konfiguracja drukarki fiskalnej */
export interface FiscalPrinterConfig {
  /** Tryb: DEMO (symulacja) lub LIVE (prawdziwa drukarka) */
  mode: "DEMO" | "LIVE";
  /** Typ połączenia */
  connectionType: "USB" | "COM" | "TCP";
  /** Adres IP (TCP) lub ścieżka portu (COM) */
  address?: string;
  /** Port TCP (domyślnie 9100 dla Posnet) */
  port?: number;
  /** Model drukarki */
  model?: string;
  /** Prędkość portu COM (baud rate) */
  baudRate?: number;
}
```

---

## 4. src/lib/hooks/usePolcardGo.ts

```typescript
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { PaymentIntent, PolcardGoDeepLinkParams } from "@/lib/payment-terminal/types";

const POLCARD_GO_PACKAGE = "com.fiserv.polcard";
const POLCARD_GO_DEEP_LINK_SCHEME = "polcardgo";
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 90;

interface UsePolcardGoOptions {
  onSuccess?: (result: PaymentIntent) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

interface UsePolcardGoReturn {
  initiatePayment: (params: InitiatePaymentParams) => Promise<void>;
  cancelPayment: () => void;
  isProcessing: boolean;
  isPolcardAvailable: boolean;
  status: PolcardPaymentStatus;
  error: string | null;
}

interface InitiatePaymentParams {
  intentId: string;
  amount: number;
  orderId: string;
  description?: string;
}

type PolcardPaymentStatus =
  | "idle"
  | "initiating"
  | "waiting_for_app"
  | "polling"
  | "success"
  | "failed"
  | "cancelled";

export function usePolcardGo(options: UsePolcardGoOptions = {}): UsePolcardGoReturn {
  const { onSuccess, onError, onCancel } = options;

  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<PolcardPaymentStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPolcardAvailable, setIsPolcardAvailable] = useState(false);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const attemptCountRef = useRef(0);
  const currentIntentIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      setIsPolcardAvailable(ua.includes("android"));
    }
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    attemptCountRef.current = 0;
  }, []);

  const pollPaymentStatus = useCallback(async (intentId: string) => {
    try {
      const response = await fetch(`/api/payment/polcard-status?intentId=${intentId}`);
      const data = await response.json();

      if (data.status === "SUCCEEDED") {
        stopPolling();
        setStatus("success");
        setIsProcessing(false);
        onSuccess?.({
          id: intentId,
          amount: data.amount,
          currency: data.currency,
          status: "SUCCEEDED",
          transactionRef: data.transactionRef,
          polcardResponse: data.polcardResponse,
        });
      } else if (data.status === "FAILED") {
        stopPolling();
        setStatus("failed");
        setError(data.errorMessage || "Płatność nie powiodła się");
        setIsProcessing(false);
        onError?.(data.errorMessage || "Płatność nie powiodła się");
      } else if (data.status === "CANCELLED") {
        stopPolling();
        setStatus("cancelled");
        setIsProcessing(false);
        onCancel?.();
      }
    } catch (e) {
      console.error("[usePolcardGo] Poll error:", e);
    }
  }, [stopPolling, onSuccess, onError, onCancel]);

  const startPolling = useCallback((intentId: string) => {
    setStatus("polling");
    attemptCountRef.current = 0;
    currentIntentIdRef.current = intentId;

    pollingRef.current = setInterval(() => {
      attemptCountRef.current++;

      if (attemptCountRef.current > MAX_POLL_ATTEMPTS) {
        stopPolling();
        setStatus("failed");
        setError("Przekroczono czas oczekiwania na płatność");
        setIsProcessing(false);
        onError?.("Przekroczono czas oczekiwania na płatność");
        return;
      }

      pollPaymentStatus(intentId);
    }, POLL_INTERVAL_MS);
  }, [pollPaymentStatus, stopPolling, onError]);

  const generateDeepLink = useCallback((params: PolcardGoDeepLinkParams): string => {
    const amountInGrosze = Math.round(params.amount * 100);

    const queryParams = new URLSearchParams({
      action: params.action,
      amount: String(amountInGrosze),
      currency: params.currency,
      orderId: params.orderId,
      callback: params.callback,
    });

    if (params.description) {
      queryParams.set("description", params.description);
    }

    return `${POLCARD_GO_DEEP_LINK_SCHEME}://payment?${queryParams.toString()}`;
  }, []);

  const generateIntentUrl = useCallback((params: PolcardGoDeepLinkParams): string => {
    const amountInGrosze = Math.round(params.amount * 100);

    return `intent://payment?amount=${amountInGrosze}&currency=${params.currency}&orderId=${params.orderId}&callback=${encodeURIComponent(params.callback)}#Intent;scheme=${POLCARD_GO_DEEP_LINK_SCHEME};package=${POLCARD_GO_PACKAGE};end`;
  }, []);

  const initiatePayment = useCallback(async (params: InitiatePaymentParams) => {
    const { intentId, amount, orderId, description } = params;

    setIsProcessing(true);
    setStatus("initiating");
    setError(null);
    currentIntentIdRef.current = intentId;

    const callbackUrl = `${window.location.origin}/api/payment/polcard-callback?intentId=${intentId}`;

    const deepLinkParams: PolcardGoDeepLinkParams = {
      action: "payment",
      amount,
      currency: "PLN",
      orderId,
      description,
      callback: callbackUrl,
    };

    const deepLink = generateDeepLink(deepLinkParams);
    const intentUrl = generateIntentUrl(deepLinkParams);

    setStatus("waiting_for_app");

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = deepLink;
    document.body.appendChild(iframe);

    setTimeout(() => {
      document.body.removeChild(iframe);

      window.location.href = intentUrl;

      setTimeout(() => {
        startPolling(intentId);
      }, 1000);
    }, 500);
  }, [generateDeepLink, generateIntentUrl, startPolling]);

  const cancelPayment = useCallback(() => {
    stopPolling();
    setStatus("cancelled");
    setIsProcessing(false);

    if (currentIntentIdRef.current) {
      fetch(`/api/payment/polcard-callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intentId: currentIntentIdRef.current,
          success: false,
          errorCode: "USER_CANCELLED",
          errorMessage: "Użytkownik anulował płatność",
        }),
      }).catch(console.error);
    }

    onCancel?.();
  }, [stopPolling, onCancel]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    initiatePayment,
    cancelPayment,
    isProcessing,
    isPolcardAvailable,
    status,
    error,
  };
}
```

---

## 5. src/lib/hooks/useWebNfc.ts

```typescript
"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface WebNfcOptions {
  onToken: (serialNumber: string) => void;
  enabled?: boolean;
}

interface NDEFReader {
  scan: (options?: { signal?: AbortSignal }) => Promise<void>;
  addEventListener: (
    event: string,
    handler: (event: NDEFReadingEvent) => void
  ) => void;
  removeEventListener: (
    event: string,
    handler: (event: NDEFReadingEvent) => void
  ) => void;
}

interface NDEFReadingEvent extends Event {
  serialNumber: string;
  message: {
    records: Array<{
      recordType: string;
      data: ArrayBuffer;
      encoding?: string;
      lang?: string;
    }>;
  };
}

declare global {
  interface Window {
    NDEFReader?: new () => NDEFReader;
  }
}

/**
 * Hook for Web NFC API (Chrome Android 89+).
 *
 * Reads NFC tag serial numbers and passes them to onToken callback.
 * Falls back gracefully on unsupported browsers.
 *
 * Requirements:
 * - HTTPS (or localhost)
 * - Chrome Android 89+
 * - User must grant NFC permission
 */
export function useWebNfc(options: WebNfcOptions) {
  const { onToken, enabled = true } = options;
  const [supported, setSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "NDEFReader" in window);
  }, []);

  const startScan = useCallback(async () => {
    if (!supported || !enabled) return;
    if (scanning) return;

    try {
      setError(null);
      const NDEFReaderClass = window.NDEFReader;
      if (!NDEFReaderClass) return;

      const reader = new NDEFReaderClass();
      abortControllerRef.current = new AbortController();

      reader.addEventListener("reading", ((event: NDEFReadingEvent) => {
        const serialNumber = event.serialNumber;
        if (serialNumber) {
          // Normalize: remove colons/dashes, uppercase
          const normalized = serialNumber
            .replace(/[:\-\s]/g, "")
            .toUpperCase();
          if (normalized.length >= 4) {
            onTokenRef.current(normalized);
          }
        }
      }) as EventListener);

      await reader.scan({ signal: abortControllerRef.current.signal });
      setScanning(true);
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Brak uprawnień NFC. Zezwól na dostęp do NFC.");
      } else if (err instanceof DOMException && err.name === "NotSupportedError") {
        setError("NFC nie jest obsługiwane na tym urządzeniu.");
      } else {
        setError("Błąd uruchamiania NFC.");
      }
      setScanning(false);
    }
  }, [supported, enabled, scanning]);

  const stopScan = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setScanning(false);
  }, []);

  // Auto-start scanning when enabled and supported
  useEffect(() => {
    if (enabled && supported) {
      startScan();
    }
    return () => {
      stopScan();
    };
  }, [enabled, supported, startScan, stopScan]);

  return { supported, scanning, error, startScan, stopScan };
}
```

---

## 6. src/lib/payment-terminal/client.ts

```typescript
import { prisma } from "@/lib/prisma";
import type { 
  TerminalConfig, 
  PaymentIntent, 
  TerminalStatus, 
  PolcardGoResponse,
  PolcardGoDeepLinkParams,
} from "./types";

const DEFAULT_CONFIG: TerminalConfig = {
  provider: "DEMO",
};

/**
 * Get terminal configuration from SystemConfig.
 */
async function getConfig(): Promise<TerminalConfig> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: "payment_terminal" },
    });
    if (config?.value && typeof config.value === "object") {
      return { ...DEFAULT_CONFIG, ...(config.value as object) } as TerminalConfig;
    }
  } catch (e) {
    console.error("[PaymentTerminal] Error reading config:", e);
  }
  return DEFAULT_CONFIG;
}

/**
 * Create a payment intent on the terminal.
 * In DEMO mode: simulates a successful payment.
 * In STRIPE mode: creates a Stripe Terminal PaymentIntent.
 * In POLCARD mode: initiates a PolCard Go transaction.
 */
export async function createPaymentIntent(
  amount: number,
  orderId: string,
  description?: string
): Promise<PaymentIntent> {
  const config = await getConfig();

  if (config.provider === "DEMO") {
    return {
      id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      amount,
      currency: "PLN",
      status: "PENDING",
    };
  }

  if (config.provider === "STRIPE") {
    return createStripePaymentIntent(config, amount, orderId, description);
  }

  if (config.provider === "POLCARD") {
    return createPolcardPaymentIntent(config, amount, orderId, description);
  }

  return { id: "", amount, currency: "PLN", status: "FAILED", errorMessage: "Nieznany provider" };
}

/**
 * Confirm/capture a payment on the terminal.
 */
export async function confirmPayment(
  intentId: string
): Promise<PaymentIntent> {
  const config = await getConfig();

  if (config.provider === "DEMO") {
    return {
      id: intentId,
      amount: 0,
      currency: "PLN",
      status: "SUCCEEDED",
      transactionRef: `DEMO-${intentId}`,
    };
  }

  if (config.provider === "STRIPE") {
    return confirmStripePayment(config, intentId);
  }

  if (config.provider === "POLCARD") {
    return confirmPolcardPayment(config, intentId);
  }

  return { id: intentId, amount: 0, currency: "PLN", status: "FAILED", errorMessage: "Nieznany provider" };
}

/**
 * Cancel a pending payment.
 */
export async function cancelPayment(intentId: string): Promise<PaymentIntent> {
  const config = await getConfig();

  if (config.provider === "DEMO") {
    return { id: intentId, amount: 0, currency: "PLN", status: "CANCELLED" };
  }

  if (config.provider === "STRIPE") {
    return cancelStripePayment(config, intentId);
  }

  if (config.provider === "POLCARD") {
    return cancelPolcardPayment(intentId);
  }

  return { id: intentId, amount: 0, currency: "PLN", status: "CANCELLED" };
}

/**
 * Get terminal status.
 */
export async function getTerminalStatus(): Promise<TerminalStatus> {
  const config = await getConfig();

  if (config.provider === "DEMO") {
    return {
      connected: true,
      provider: "DEMO",
      message: "Tryb DEMO — terminal symulowany",
    };
  }

  if (config.provider === "STRIPE") {
    return getStripeTerminalStatus(config);
  }

  if (config.provider === "POLCARD") {
    return getPolcardTerminalStatus(config);
  }

  return { connected: false, provider: config.provider, message: "Nieznany provider" };
}

// ─── Stripe Terminal ────────────────────────────────────────────────

async function createStripePaymentIntent(
  config: TerminalConfig,
  amount: number,
  orderId: string,
  description?: string
): Promise<PaymentIntent> {
  try {
    const response = await fetch("https://api.stripe.com/v1/terminal/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        amount: String(Math.round(amount * 100)),
        currency: "pln",
        "payment_method_types[]": "card_present",
        description: description ?? `Zamówienie POS`,
        "metadata[orderId]": orderId,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        id: "",
        amount,
        currency: "PLN",
        status: "FAILED",
        errorMessage: data.error?.message ?? "Błąd Stripe",
      };
    }

    return {
      id: data.id,
      amount,
      currency: "PLN",
      status: "PENDING",
    };
  } catch (e) {
    return {
      id: "",
      amount,
      currency: "PLN",
      status: "FAILED",
      errorMessage: e instanceof Error ? e.message : "Błąd połączenia ze Stripe",
    };
  }
}

async function confirmStripePayment(
  config: TerminalConfig,
  intentId: string
): Promise<PaymentIntent> {
  try {
    const response = await fetch(
      `https://api.stripe.com/v1/terminal/payment_intents/${intentId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const data = await response.json();
    return {
      id: intentId,
      amount: (data.amount ?? 0) / 100,
      currency: "PLN",
      status: data.status === "succeeded" ? "SUCCEEDED" : "FAILED",
      transactionRef: data.charges?.data?.[0]?.id,
      errorMessage: data.status !== "succeeded" ? (data.error?.message ?? "Nie udało się") : undefined,
    };
  } catch (e) {
    return {
      id: intentId,
      amount: 0,
      currency: "PLN",
      status: "FAILED",
      errorMessage: e instanceof Error ? e.message : "Błąd",
    };
  }
}

async function cancelStripePayment(
  config: TerminalConfig,
  intentId: string
): Promise<PaymentIntent> {
  try {
    await fetch(
      `https://api.stripe.com/v1/payment_intents/${intentId}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return { id: intentId, amount: 0, currency: "PLN", status: "CANCELLED" };
  } catch {
    return { id: intentId, amount: 0, currency: "PLN", status: "CANCELLED" };
  }
}

async function getStripeTerminalStatus(config: TerminalConfig): Promise<TerminalStatus> {
  try {
    const response = await fetch("https://api.stripe.com/v1/terminal/readers", {
      headers: { Authorization: `Bearer ${config.apiKey}` },
    });
    const data = await response.json();
    const readers = data.data ?? [];
    const online = readers.filter((r: { status: string }) => r.status === "online");
    return {
      connected: online.length > 0,
      provider: "STRIPE",
      terminalId: online[0]?.id,
      message: `${online.length}/${readers.length} czytników online`,
    };
  } catch {
    return { connected: false, provider: "STRIPE", message: "Błąd połączenia ze Stripe" };
  }
}

// ─── PolCard Go ─────────────────────────────────────────────────────

const POLCARD_GO_PACKAGE = "com.fiserv.polcard";
const POLCARD_GO_DEEP_LINK_SCHEME = "polcardgo";

async function createPolcardPaymentIntent(
  config: TerminalConfig,
  amount: number,
  orderId: string,
  description?: string
): Promise<PaymentIntent> {
  const intentId = `polcard-${Date.now()}-${orderId.slice(0, 8)}`;
  
  try {
    await prisma.pendingPayment.create({
      data: {
        id: intentId,
        orderId,
        amount,
        currency: "PLN",
        provider: "POLCARD",
        status: "PENDING",
        metadata: {
          description,
          merchantId: config.polcardConfig?.merchantId ?? config.merchantId,
          terminalId: config.polcardConfig?.terminalId ?? config.terminalId,
          createdAt: new Date().toISOString(),
        },
      },
    });
  } catch (e) {
    console.error("[PolCard Go] Error saving pending payment:", e);
  }

  return {
    id: intentId,
    amount,
    currency: "PLN",
    status: "PENDING",
  };
}

async function confirmPolcardPayment(
  config: TerminalConfig,
  intentId: string
): Promise<PaymentIntent> {
  try {
    const pending = await prisma.pendingPayment.findUnique({
      where: { id: intentId },
    });

    if (!pending) {
      return {
        id: intentId,
        amount: 0,
        currency: "PLN",
        status: "FAILED",
        errorMessage: "Płatność nie została znaleziona",
      };
    }

    if (pending.status === "COMPLETED") {
      const response = pending.response as PolcardGoResponse | null;
      return {
        id: intentId,
        amount: Number(pending.amount),
        currency: "PLN",
        status: "SUCCEEDED",
        transactionRef: response?.transactionId ?? `PC-${intentId}`,
        polcardResponse: response ?? undefined,
      };
    }

    if (pending.status === "FAILED" || pending.status === "CANCELLED") {
      const response = pending.response as PolcardGoResponse | null;
      return {
        id: intentId,
        amount: Number(pending.amount),
        currency: "PLN",
        status: pending.status === "FAILED" ? "FAILED" : "CANCELLED",
        errorMessage: response?.errorMessage ?? "Płatność nie powiodła się",
      };
    }

    return {
      id: intentId,
      amount: Number(pending.amount),
      currency: "PLN",
      status: "PROCESSING",
    };
  } catch (e) {
    console.error("[PolCard Go] Error confirming payment:", e);
    return {
      id: intentId,
      amount: 0,
      currency: "PLN",
      status: "FAILED",
      errorMessage: "Błąd sprawdzania statusu płatności",
    };
  }
}

async function cancelPolcardPayment(
  intentId: string
): Promise<PaymentIntent> {
  try {
    await prisma.pendingPayment.update({
      where: { id: intentId },
      data: { status: "CANCELLED" },
    });
  } catch (e) {
    console.error("[PolCard Go] Error cancelling payment:", e);
  }

  return { id: intentId, amount: 0, currency: "PLN", status: "CANCELLED" };
}

async function getPolcardTerminalStatus(config: TerminalConfig): Promise<TerminalStatus> {
  const merchantId = config.polcardConfig?.merchantId ?? config.merchantId;
  const terminalId = config.polcardConfig?.terminalId ?? config.terminalId;
  
  return {
    connected: !!merchantId && !!terminalId,
    provider: "POLCARD",
    terminalId,
    message: merchantId && terminalId 
      ? `PolCard Go gotowy (Terminal: ${terminalId})`
      : "Brak konfiguracji PolCard Go — uzupełnij merchantId i terminalId",
  };
}

/**
 * Generate a deep link URL to invoke PolCard Go app for payment.
 * Used on Android devices with PolCard Go installed.
 */
export function generatePolcardGoDeepLink(params: PolcardGoDeepLinkParams): string {
  const { action, amount, currency, orderId, description, callback } = params;
  
  const amountInGrosze = Math.round(amount * 100);
  
  const queryParams = new URLSearchParams({
    action,
    amount: String(amountInGrosze),
    currency,
    orderId,
    callback: encodeURIComponent(callback),
  });
  
  if (description) {
    queryParams.set("description", description);
  }
  
  return `${POLCARD_GO_DEEP_LINK_SCHEME}://payment?${queryParams.toString()}`;
}

/**
 * Generate an Android Intent URL for PolCard Go.
 * Fallback when deep link scheme doesn't work.
 */
export function generatePolcardGoIntentUrl(params: PolcardGoDeepLinkParams): string {
  const deepLink = generatePolcardGoDeepLink(params);
  
  return `intent://payment?${new URLSearchParams({
    amount: String(Math.round(params.amount * 100)),
    currency: params.currency,
    orderId: params.orderId,
    callback: params.callback,
  }).toString()}#Intent;scheme=${POLCARD_GO_DEEP_LINK_SCHEME};package=${POLCARD_GO_PACKAGE};end`;
}

/**
 * Check if PolCard Go app is likely installed (Android only).
 * Returns true on Android, false on iOS/desktop.
 */
export function isPolcardGoAvailable(): boolean {
  if (typeof window === "undefined") return false;
  
  const ua = navigator.userAgent.toLowerCase();
  const isAndroid = ua.includes("android");
  
  return isAndroid;
}

/**
 * Process callback response from PolCard Go.
 * Called by the callback API endpoint.
 */
export async function processPolcardGoCallback(
  intentId: string,
  response: PolcardGoResponse
): Promise<PaymentIntent> {
  try {
    const status = response.success ? "COMPLETED" : "FAILED";
    
    await prisma.pendingPayment.update({
      where: { id: intentId },
      data: {
        status,
        response: response as object,
        completedAt: new Date(),
      },
    });

    return {
      id: intentId,
      amount: response.amount ?? 0,
      currency: response.currency ?? "PLN",
      status: response.success ? "SUCCEEDED" : "FAILED",
      transactionRef: response.transactionId,
      errorMessage: response.errorMessage,
      polcardResponse: response,
    };
  } catch (e) {
    console.error("[PolCard Go] Error processing callback:", e);
    return {
      id: intentId,
      amount: 0,
      currency: "PLN",
      status: "FAILED",
      errorMessage: "Błąd przetwarzania odpowiedzi PolCard Go",
    };
  }
}

/**
 * Poll for payment status (for use when waiting for PolCard Go callback).
 */
export async function pollPolcardPaymentStatus(
  intentId: string,
  maxAttempts = 60,
  intervalMs = 2000
): Promise<PaymentIntent> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await confirmPolcardPayment({} as TerminalConfig, intentId);
    
    if (result.status === "SUCCEEDED" || result.status === "FAILED" || result.status === "CANCELLED") {
      return result;
    }
    
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  return {
    id: intentId,
    amount: 0,
    currency: "PLN",
    status: "FAILED",
    errorMessage: "Przekroczono czas oczekiwania na płatność",
  };
}
```

---

## 7. src/lib/payment-terminal/types.ts

```typescript
/**
 * Payment terminal integration types.
 * Supports Stripe Terminal and PolCard Go (SoftPOS).
 */

export type TerminalProvider = "STRIPE" | "POLCARD" | "DEMO";

export interface TerminalConfig {
  provider: TerminalProvider;
  apiKey?: string;
  locationId?: string;
  merchantId?: string;
  terminalId?: string;
  polcardConfig?: PolcardGoConfig;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
  transactionRef?: string;
  errorMessage?: string;
  polcardResponse?: PolcardGoResponse;
}

export interface TerminalStatus {
  connected: boolean;
  provider: TerminalProvider;
  terminalId?: string;
  batteryLevel?: number;
  message?: string;
}

// ─── PolCard Go Types ────────────────────────────────────────────────

export interface PolcardGoConfig {
  merchantId: string;
  terminalId: string;
  callbackUrl: string;
  appPackage?: string;
  deepLinkScheme?: string;
}

export interface PolcardGoPaymentRequest {
  amount: number;
  currency: "PLN";
  orderId: string;
  description?: string;
  callbackUrl: string;
  merchantReference?: string;
}

export interface PolcardGoResponse {
  success: boolean;
  transactionId?: string;
  authorizationCode?: string;
  cardMasked?: string;
  cardType?: "VISA" | "MASTERCARD" | "OTHER";
  amount?: number;
  currency?: string;
  timestamp?: string;
  errorCode?: string;
  errorMessage?: string;
  receiptData?: PolcardGoReceiptData;
}

export interface PolcardGoReceiptData {
  merchantName?: string;
  merchantAddress?: string;
  terminalId?: string;
  transactionDate?: string;
  transactionTime?: string;
  cardNumber?: string;
  authCode?: string;
  rrn?: string;
  aid?: string;
  tvr?: string;
}

export interface PolcardGoDeepLinkParams {
  action: "payment" | "refund" | "status";
  amount: number;
  currency: string;
  orderId: string;
  description?: string;
  callback: string;
}

export type PolcardGoTransactionStatus = 
  | "INITIATED"
  | "WAITING_FOR_CARD" 
  | "PROCESSING"
  | "APPROVED"
  | "DECLINED"
  | "CANCELLED"
  | "ERROR"
  | "TIMEOUT";
```

---

## 8. src/lib/e-receipt/generator.ts

```typescript
export type ReceiptData = {
  orderNumber: number;
  date: string; // ISO date
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    vatSymbol: string;
  }>;
  subtotal: number;
  discountAmount: number;
  total: number;
  vatBreakdown: Record<
    string,
    { net: number; vat: number; gross: number }
  >;
  paymentMethod: string;
  companyName: string;
  companyNip: string;
  companyAddress: string;
  buyerNip?: string;
};

function formatMoney(value: number): string {
  return value.toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function paymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    CASH: "Gotówka",
    CARD: "Karta",
    BLIK: "Blik",
    TRANSFER: "Przelew",
    VOUCHER: "Voucher",
  };
  return labels[method] ?? method;
}

export function generateReceiptHtml(data: ReceiptData): string {
  const dateFormatted = formatDate(data.date);
  const paymentLabel = paymentMethodLabel(data.paymentMethod);

  const itemsRows = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.name)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatMoney(item.unitPrice)} zł</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatMoney(item.quantity * item.unitPrice)} zł</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:11px;">${escapeHtml(item.vatSymbol)}</td>
    </tr>`
    )
    .join("");

  const vatRows = Object.entries(data.vatBreakdown)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([sym, vals]) => `
    <tr>
      <td style="padding:4px 8px;font-size:12px;">VAT ${escapeHtml(sym)}</td>
      <td style="padding:4px 8px;text-align:right;font-size:12px;">${formatMoney(vals.net)} zł</td>
      <td style="padding:4px 8px;text-align:right;font-size:12px;">${formatMoney(vals.vat)} zł</td>
      <td style="padding:4px 8px;text-align:right;font-size:12px;">${formatMoney(vals.gross)} zł</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <title>E-paragon #${data.orderNumber}</title>
</head>
<body style="margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;color:#1f2937;background:#fafafa;line-height:1.5;">
  <div style="max-width:400px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;">
    <header style="padding:20px;background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 100%);color:#fff;text-align:center;">
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;">${escapeHtml(data.companyName)}</h1>
      <p style="margin:0;font-size:12px;opacity:0.95;">NIP: ${escapeHtml(data.companyNip)}</p>
      <p style="margin:4px 0 0;font-size:11px;opacity:0.9;">${escapeHtml(data.companyAddress)}</p>
    </header>
    <div style="padding:16px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:16px;font-size:13px;color:#6b7280;">
        <span>Paragon nr ${data.orderNumber}</span>
        <span>${dateFormatted}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:8px;text-align:left;font-weight:600;">Produkt</th>
            <th style="padding:8px;text-align:center;font-weight:600;">Ilość</th>
            <th style="padding:8px;text-align:right;font-weight:600;">Cena/jedn.</th>
            <th style="padding:8px;text-align:right;font-weight:600;">Wartość</th>
            <th style="padding:8px;text-align:center;font-weight:600;">VAT</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
      ${data.discountAmount > 0 ? `
      <div style="margin-top:12px;padding:8px;background:#fef3c7;border-radius:6px;font-size:13px;">
        <span>Rabat:</span>
        <strong style="float:right;">−${formatMoney(data.discountAmount)} zł</strong>
      </div>
      ` : ""}
      <table style="width:100%;margin-top:16px;border-collapse:collapse;font-size:12px;color:#6b7280;">
        <thead>
          <tr>
            <th style="padding:6px 8px;text-align:left;">Stawka</th>
            <th style="padding:6px 8px;text-align:right;">Netto</th>
            <th style="padding:6px 8px;text-align:right;">VAT</th>
            <th style="padding:6px 8px;text-align:right;">Brutto</th>
          </tr>
        </thead>
        <tbody>
          ${vatRows}
        </tbody>
      </table>
      <div style="margin-top:20px;padding:16px;background:#1e3a5f;border-radius:8px;color:#fff;text-align:center;">
        <div style="font-size:12px;opacity:0.9;">RAZEM DO ZAPŁATY</div>
        <div style="font-size:28px;font-weight:700;margin-top:4px;">${formatMoney(data.total)} zł</div>
      </div>
      <div style="margin-top:12px;font-size:13px;color:#6b7280;">
        <strong>Płatność:</strong> ${escapeHtml(paymentLabel)}
      </div>
      ${data.buyerNip ? `
      <div style="margin-top:8px;font-size:13px;color:#6b7280;">
        <strong>NIP nabywcy:</strong> ${escapeHtml(data.buyerNip)}
      </div>
      ` : ""}
    </div>
    <footer style="padding:16px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;">
      E-paragon wygenerowany elektronicznie
    </footer>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return String(text).replace(/[&<>"']/g, (c) => map[c] ?? c);
}

/**
 * Extracts body inner HTML from a full document string.
 * Use when embedding receipt HTML inside a page (to avoid nested html/body).
 */
export function extractReceiptBody(html: string): string {
  const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return match ? match[1].trim() : html;
}
```

---

## 9. src/lib/e-receipt/qr.ts

```typescript
import QRCode from "qrcode";

/**
 * Generates a QR code as a data URL (base64 PNG).
 * Uses the qrcode npm package.
 */
export async function generateQRDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    type: "image/png",
    margin: 2,
    width: 200,
    errorCorrectionLevel: "M",
  });
}
```

---

## 10. src/app/api/orders/[id]/close/route.ts

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { posnetDriver } from "@/lib/fiscal";
import { consumeStockForOrder } from "@/lib/warehouse/auto-consume";
import type { ReceiptPayload } from "@/lib/fiscal";
import { parseBodyOptional, closeOrderSchema } from "@/lib/validation";
import { generateReceiptHtml, type ReceiptData } from "@/lib/e-receipt/generator";
import { addDays } from "date-fns";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const { data, error: valError } = await parseBodyOptional(request, closeOrderSchema);
    if (valError) return valError;
    const { receipt, buyerNip } = data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: true,
        payments: true,
        items: {
          where: { status: { not: "CANCELLED" } },
          include: { product: true, taxRate: true },
        },
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 404 });
    }
    if (order.status === "CLOSED") {
      return NextResponse.json({ error: "Zamówienie już zamknięte" }, { status: 400 });
    }

    const orderTotal = order.items.reduce(
      (sum, i) =>
        sum + Number(i.quantity) * Number(i.unitPrice) - Number(i.discountAmount ?? 0),
      0
    );
    let orderDiscount = 0;
    if (order.discountJson && typeof order.discountJson === "object") {
      const d = order.discountJson as { type?: string; value?: number };
      if (d.type === "PERCENT" && typeof d.value === "number") {
        orderDiscount = (orderTotal * d.value) / 100;
      } else if (d.type === "AMOUNT" && typeof d.value === "number") {
        orderDiscount = d.value;
      }
    }
    const finalTotal = Math.round((orderTotal - orderDiscount) * 100) / 100;
    const paidTotal = Math.round(
      order.payments.reduce((sum, p) => sum + Number(p.amount), 0) * 100
    ) / 100;

    // Allow closing zero-balance orders without payments
    if (finalTotal > 0 && paidTotal < finalTotal) {
      return NextResponse.json(
        {
          error: `Suma płatności (${paidTotal.toFixed(2)} zł) nie pokrywa kwoty zamówienia (${finalTotal.toFixed(2)} zł)`,
        },
        { status: 400 }
      );
    }

    let fiscalNumber: string | null = null;
    let printerId = "default";

    if (receipt) {
      const fiscalPrinter = await prisma.printer.findFirst({
        where: { type: "FISCAL", isActive: true },
      });
      if (fiscalPrinter) printerId = fiscalPrinter.id;

      const payload: ReceiptPayload = {
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
        buyerNip: typeof buyerNip === "string" && buyerNip.trim() ? buyerNip.trim() : undefined,
      };

      let discountAmount = 0;
      if (order.discountJson && typeof order.discountJson === "object") {
        const d = order.discountJson as { type?: string; value?: number };
        if (d.type === "PERCENT" && typeof d.value === "number") {
          const subtotal = payload.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
          discountAmount = (subtotal * d.value) / 100;
        } else if (d.type === "AMOUNT" && typeof d.value === "number") {
          discountAmount = d.value;
        }
      }
      if (discountAmount > 0) payload.discountAmount = discountAmount;

      const result = await posnetDriver.printReceipt(payload);
      if (result.success && result.fiscalNumber) {
        fiscalNumber = result.fiscalNumber;
      } else {
        fiscalNumber = `DEMO-${Date.now()}`;
        console.warn("[close] Fiskalizacja nieudana, rachunek niefiskalny:", result.error);
      }
    }

    const finalFiscalNumber = fiscalNumber;
    const finalPrinterId = printerId;
    const finalBuyerNip = typeof buyerNip === "string" && buyerNip.trim() ? buyerNip.trim() : null;

    // Build e-receipt HTML
    let receiptHtml: string | null = null;
    if (receipt) {
      const configRows = await prisma.systemConfig.findMany({
        where: { key: { in: ["companyName", "companyNip", "companyAddress"] } },
      });
      const cfg: Record<string, string> = {};
      for (const r of configRows) cfg[r.key] = String(r.value ?? "");

      const vatRates: Record<string, number> = {};
      for (const item of order.items) {
        vatRates[item.taxRate.fiscalSymbol || "A"] = Number(item.taxRate.ratePercent);
      }

      const subtotal = order.items.reduce(
        (s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0
      );

      const vatBreakdown: Record<string, { net: number; vat: number; gross: number }> = {};
      for (const item of order.items) {
        const sym = item.taxRate.fiscalSymbol || "A";
        const rate = Number(item.taxRate.ratePercent);
        const lineGross = Number(item.quantity) * Number(item.unitPrice);
        const lineNet = lineGross / (1 + rate / 100);
        const lineVat = lineGross - lineNet;
        if (!vatBreakdown[sym]) vatBreakdown[sym] = { net: 0, vat: 0, gross: 0 };
        vatBreakdown[sym].net += lineNet;
        vatBreakdown[sym].vat += lineVat;
        vatBreakdown[sym].gross += lineGross;
      }

      const primaryMethod = order.payments[0]?.method ?? "CASH";

      const receiptData: ReceiptData = {
        orderNumber: order.orderNumber,
        date: new Date().toISOString(),
        items: order.items.map((i) => ({
          name: i.product.name,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          vatSymbol: i.taxRate.fiscalSymbol || "A",
        })),
        subtotal,
        discountAmount: orderDiscount,
        total: finalTotal,
        vatBreakdown,
        paymentMethod: primaryMethod,
        companyName: cfg.companyName || "Karczma Łabędź",
        companyNip: cfg.companyNip || "",
        companyAddress: cfg.companyAddress || "",
        buyerNip: finalBuyerNip ?? undefined,
      };

      receiptHtml = generateReceiptHtml(receiptData);
    }

    const now = new Date();
    let receiptToken: string | null = null;

    await prisma.$transaction(async (tx) => {
      if (receipt && finalFiscalNumber) {
        const createdReceipt = await tx.receipt.create({
          data: {
            orderId,
            fiscalNumber: finalFiscalNumber,
            printerId: finalPrinterId,
            buyerNip: finalBuyerNip || undefined,
            htmlContent: receiptHtml,
            expiresAt: addDays(now, 30),
          },
        });
        receiptToken = createdReceipt.token;
      }
      await tx.orderItem.updateMany({
        where: { orderId, status: "READY" },
        data: { status: "SERVED", servedAt: now },
      });
      await tx.order.update({
        where: { id: orderId },
        data: { status: "CLOSED", closedAt: now },
      });
      if (order.tableId) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: "FREE" },
        });
      }
    });

    await auditLog(null, "ORDER_CLOSED", "Order", orderId, { status: order.status }, { status: "CLOSED" });
    try {
      await consumeStockForOrder(orderId, order.userId);
    } catch (e) {
      console.error("[close] Auto-rozchód magazynowy:", e);
    }
    return NextResponse.json({
      ok: true,
      fiscalNumber: finalFiscalNumber ?? undefined,
      receiptToken: receiptToken ?? undefined,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd zamykania rachunku" }, { status: 500 });
  }
}
```

---

## 11. src/app/api/payments/route.ts

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, createPaymentSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const { data, error: valError } = await parseBody(request, createPaymentSchema);
    if (valError) return valError;
    const { orderId, payments, tipAmount, tipUserId } = data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        payments: true,
        items: {
          where: { status: { not: "CANCELLED" } },
          select: { quantity: true, unitPrice: true, discountAmount: true },
        },
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 404 });
    }
    if (order.status === "CLOSED") {
      return NextResponse.json({ error: "Zamówienie jest już zamknięte" }, { status: 400 });
    }
    if (order.status === "CANCELLED") {
      return NextResponse.json({ error: "Zamówienie jest anulowane" }, { status: 400 });
    }

    const existingPaid = order.payments.reduce(
      (sum, p) => sum + Number(p.amount), 0
    );
    if (existingPaid > 0) {
      return NextResponse.json(
        { error: "Zamówienie ma już zarejestrowane płatności. Usuń je przed dodaniem nowych." },
        { status: 400 }
      );
    }

    const orderTotal = order.items.reduce(
      (sum, i) =>
        sum + Number(i.quantity) * Number(i.unitPrice) - Number(i.discountAmount ?? 0),
      0
    );

    let discountAmount = 0;
    if (order.discountJson && typeof order.discountJson === "object") {
      const d = order.discountJson as { type?: string; value?: number };
      if (d.type === "PERCENT" && typeof d.value === "number") {
        discountAmount = (orderTotal * d.value) / 100;
      } else if (d.type === "AMOUNT" && typeof d.value === "number") {
        discountAmount = d.value;
      }
    }
    const finalTotal = Math.round((orderTotal - discountAmount) * 100) / 100;

    const paymentSum = Math.round(
      payments.reduce((sum, p) => sum + p.amount, 0) * 100
    ) / 100;

    if (paymentSum < finalTotal) {
      return NextResponse.json(
        {
          error: `Suma płatności (${paymentSum.toFixed(2)} zł) jest mniejsza niż kwota zamówienia (${finalTotal.toFixed(2)} zł)`,
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      for (const p of payments) {
        await tx.payment.create({
          data: {
            orderId,
            method: p.method as "CASH" | "CARD" | "BLIK" | "TRANSFER" | "VOUCHER" | "ROOM_CHARGE",
            amount: p.amount,
            tipAmount: 0,
            transactionRef: p.transactionRef ?? null,
          },
        });
      }
      if (tipAmount != null && tipAmount > 0 && tipUserId) {
        const firstPayment = payments[0];
        await tx.tip.create({
          data: {
            orderId,
            userId: tipUserId,
            amount: tipAmount,
            method: (firstPayment?.method as "CASH" | "CARD" | "BLIK" | "TRANSFER" | "VOUCHER" | "ROOM_CHARGE") ?? "CASH",
          },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd zapisu płatności" }, { status: 500 });
  }
}
```

---

## 12. src/app/api/fiscal/route.ts

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { posnetDriver } from "@/lib/fiscal";

/** GET /api/fiscal — status drukarki fiskalnej (test połączenia) */
export async function GET() {
  try {
    const status = await posnetDriver.getStatus();
    return NextResponse.json(status);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, connected: false, message: "Błąd połączenia z drukarką fiskalną" },
      { status: 500 }
    );
  }
}

/** POST /api/fiscal — raport dobowy: wydruk na drukarce + zapis DailyReport */
export async function POST() {
  try {
    const result = await posnetDriver.printDailyReport();
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? "Błąd wydruku raportu dobowego" }, { status: 500 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const closedToday = await prisma.order.findMany({
      where: {
        status: "CLOSED",
        closedAt: { gte: today, lt: tomorrow },
      },
      include: {
        items: { where: { status: { not: "CANCELLED" } }, include: { product: true, taxRate: true } },
        payments: true,
        receipts: true,
        invoices: true,
      },
    });

    let totalGross = 0;
    let totalNet = 0;
    const vatBreakdown: Record<string, { net: number; vat: number; gross: number }> = {};
    const paymentBreakdown: Record<string, number> = { cash: 0, card: 0, blik: 0, transfer: 0 };
    let receiptCount = 0;
    let invoiceCount = 0;
    let cancelCount = 0;
    let cancelAmount = 0;

    for (const order of closedToday) {
      let orderGross = 0;
      for (const item of order.items) {
        const lineGross = Number(item.quantity) * Number(item.unitPrice);
        orderGross += lineGross;
        const rate = Number(item.taxRate?.ratePercent ?? 0);
        const net = lineGross / (1 + rate / 100);
        const vat = lineGross - net;
        const sym = item.taxRate?.fiscalSymbol ?? "A";
        if (!vatBreakdown[sym]) vatBreakdown[sym] = { net: 0, vat: 0, gross: 0 };
        vatBreakdown[sym].net += net;
        vatBreakdown[sym].vat += vat;
        vatBreakdown[sym].gross += lineGross;
      }
      let discount = 0;
      if (order.discountJson && typeof order.discountJson === "object") {
        const d = order.discountJson as { type?: string; value?: number };
        if (d.type === "PERCENT" && typeof d.value === "number") discount = (orderGross * d.value) / 100;
        else if (d.type === "AMOUNT" && typeof d.value === "number") discount = d.value;
      }
      orderGross = Math.max(0, orderGross - discount);
      totalGross += orderGross;
      for (const p of order.payments) {
        const m = (p.method ?? "cash").toLowerCase();
        if (m in paymentBreakdown) (paymentBreakdown as Record<string, number>)[m] += Number(p.amount);
        else paymentBreakdown.transfer += Number(p.amount);
      }
      receiptCount += order.receipts.length;
      invoiceCount += order.invoices.length;
    }

    const cancelledToday = await prisma.order.findMany({
      where: { status: "CANCELLED", createdAt: { gte: today, lt: tomorrow } },
      include: { items: true },
    });
    for (const o of cancelledToday) {
      cancelCount += 1;
      cancelAmount += o.items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);
    }

    for (const v of Object.values(vatBreakdown)) {
      totalNet += v.net;
    }

    const guestCount = closedToday.length;
    const avgTicket = guestCount > 0 ? totalGross / guestCount : 0;

    await prisma.dailyReport.upsert({
      where: { date: today },
      create: {
        date: today,
        totalGross,
        totalNet,
        vatBreakdownJson: vatBreakdown,
        paymentBreakdownJson: paymentBreakdown,
        receiptCount,
        invoiceCount,
        guestCount,
        avgTicket,
        cancelCount,
        cancelAmount,
      },
      update: {
        totalGross,
        totalNet,
        vatBreakdownJson: vatBreakdown,
        paymentBreakdownJson: paymentBreakdown,
        receiptCount,
        invoiceCount,
        guestCount,
        avgTicket,
        cancelCount,
        cancelAmount,
      },
    });

    return NextResponse.json({ ok: true, date: today.toISOString().slice(0, 10) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd raportu dobowego" }, { status: 500 });
  }
}
```

---

## 13. src/components/ConnectionMonitor.tsx

```typescript
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { WifiOff, Wifi, ArrowRight, Zap } from "lucide-react";

const MAIN_SERVER = process.env.NEXT_PUBLIC_MAIN_SERVER_URL ?? "https://pos.karczma-labedz.pl";
const LOCAL_SERVER = process.env.NEXT_PUBLIC_LOCAL_SERVER_URL ?? "http://10.119.169.20:3001";
const CHECK_INTERVAL = Number(process.env.NEXT_PUBLIC_CONNECTION_CHECK_INTERVAL) || 30000;
const REDIRECT_DELAY = Number(process.env.NEXT_PUBLIC_REDIRECT_DELAY) || 5000;
const PREFERRED_SERVER_KEY = "pos-preferred-server";

type ConnectionStatus = "online" | "offline" | "checking" | "local";
type ServerCheckResult = { url: string; available: boolean; latencyMs: number };

export function ConnectionMonitor() {
  const [status, setStatus] = useState<ConnectionStatus>("checking");
  const [isOnLocalServer, setIsOnLocalServer] = useState(false);
  const [mainServerAvailable, setMainServerAvailable] = useState(false);
  const [localServerAvailable, setLocalServerAvailable] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [fasterServer, setFasterServer] = useState<string | null>(null);
  const isInitialCheck = useRef(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLocal =
        window.location.hostname === "10.119.169.20" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      setIsOnLocalServer(isLocal);
    }
  }, []);

  const checkServerWithLatency = useCallback(async (url: string): Promise<ServerCheckResult> => {
    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      await fetch(`${url}/api/ping`, {
        method: "HEAD",
        mode: "no-cors",
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return { url, available: true, latencyMs: performance.now() - start };
    } catch {
      return { url, available: false, latencyMs: Infinity };
    }
  }, []);

  const checkServer = useCallback(async (url: string): Promise<boolean> => {
    const result = await checkServerWithLatency(url);
    return result.available;
  }, [checkServerWithLatency]);

  const checkBothServers = useCallback(async (): Promise<{ main: ServerCheckResult; local: ServerCheckResult }> => {
    const [main, local] = await Promise.all([
      checkServerWithLatency(MAIN_SERVER),
      checkServerWithLatency(LOCAL_SERVER),
    ]);
    return { main, local };
  }, [checkServerWithLatency]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    let countdownInterval: NodeJS.Timeout | undefined;

    const checkConnection = async () => {
      const isOnline = navigator.onLine;
      
      if (!isOnline) {
        setStatus("offline");
        if (!isOnLocalServer) {
          setShowBanner(true);
          setCountdown(REDIRECT_DELAY / 1000);
          countdownInterval = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                if (countdownInterval) clearInterval(countdownInterval);
                window.location.href = LOCAL_SERVER;
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
        return;
      }

      const { main, local } = await checkBothServers();
      setMainServerAvailable(main.available);
      setLocalServerAvailable(local.available);

      if (main.available && local.available) {
        const faster = main.latencyMs < local.latencyMs ? MAIN_SERVER : LOCAL_SERVER;
        setFasterServer(faster);

        if (isOnLocalServer) {
          setStatus("local");
          if (main.latencyMs < local.latencyMs * 0.7 && !dismissed) {
            setShowBanner(true);
          }
        } else {
          setStatus("online");
          if (local.latencyMs < main.latencyMs * 0.7 && !dismissed && isInitialCheck.current) {
            setShowBanner(true);
          }
        }
      } else if (main.available && !local.available) {
        setFasterServer(MAIN_SERVER);
        if (isOnLocalServer && !dismissed) {
          setShowBanner(true);
          setStatus("local");
        } else {
          setStatus("online");
          setShowBanner(false);
        }
      } else if (!main.available && local.available) {
        setFasterServer(LOCAL_SERVER);
        if (!isOnLocalServer) {
          setStatus("offline");
          setShowBanner(true);
          setCountdown(REDIRECT_DELAY / 1000);
          countdownInterval = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                if (countdownInterval) clearInterval(countdownInterval);
                window.location.href = LOCAL_SERVER;
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          setStatus("local");
          setShowBanner(false);
        }
      } else {
        setFasterServer(null);
        setStatus("offline");
      }

      isInitialCheck.current = false;
    };

    const initialCheck = setTimeout(checkConnection, 1000);
    intervalId = setInterval(checkConnection, CHECK_INTERVAL);

    const handleOnline = () => checkConnection();
    const handleOffline = () => checkConnection();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearTimeout(initialCheck);
      if (intervalId) clearInterval(intervalId);
      if (countdownInterval) clearInterval(countdownInterval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isOnLocalServer, checkBothServers, dismissed]);

  const handleGoToMain = () => {
    window.location.href = MAIN_SERVER;
  };

  const handleStayLocal = () => {
    setDismissed(true);
    setShowBanner(false);
  };

  const handleCancelRedirect = () => {
    setCountdown(0);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  // Na serwerze lokalnym, główny dostępny - sugestia przejścia do chmury
  if (isOnLocalServer && mainServerAvailable && fasterServer === MAIN_SERVER) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-green-600 text-white px-4 py-3 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5" />
            <div>
              <p className="font-medium">Serwer w chmurze jest szybszy!</p>
              <p className="text-sm opacity-90">
                Główny serwer odpowiada szybciej. Zalecamy przejście do wersji w chmurze.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleStayLocal}
              className="px-3 py-1.5 text-sm bg-green-700 hover:bg-green-800 rounded transition-colors"
            >
              Zostań lokalnie
            </button>
            <button
              onClick={handleGoToMain}
              className="px-3 py-1.5 text-sm bg-white text-green-700 hover:bg-green-50 rounded font-medium flex items-center gap-1 transition-colors"
            >
              Przejdź do chmury
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Na serwerze lokalnym, główny dostępny ale wolniejszy
  if (isOnLocalServer && mainServerAvailable && fasterServer === LOCAL_SERVER) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-blue-600 text-white px-4 py-3 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Wifi className="w-5 h-5" />
            <div>
              <p className="font-medium">Internet dostępny</p>
              <p className="text-sm opacity-90">
                Serwer lokalny jest szybszy - zostajesz tutaj.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleStayLocal}
              className="px-3 py-1.5 text-sm bg-blue-700 hover:bg-blue-800 rounded transition-colors"
            >
              OK
            </button>
            <button
              onClick={handleGoToMain}
              className="px-3 py-1.5 text-sm bg-white text-blue-700 hover:bg-blue-50 rounded font-medium flex items-center gap-1 transition-colors"
            >
              Mimo to przejdź
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Na głównym serwerze, lokalny jest szybszy - sugestia przejścia
  if (!isOnLocalServer && localServerAvailable && fasterServer === LOCAL_SERVER && status !== "offline") {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-600 text-white px-4 py-3 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5" />
            <div>
              <p className="font-medium">Serwer lokalny jest szybszy!</p>
              <p className="text-sm opacity-90">
                Jesteś w sieci lokalnej - przełącz się dla lepszej wydajności.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleStayLocal}
              className="px-3 py-1.5 text-sm bg-amber-700 hover:bg-amber-800 rounded transition-colors"
            >
              Zostań w chmurze
            </button>
            <button
              onClick={() => (window.location.href = LOCAL_SERVER)}
              className="px-3 py-1.5 text-sm bg-white text-amber-700 hover:bg-amber-50 rounded font-medium flex items-center gap-1 transition-colors"
            >
              Przejdź lokalnie
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Na głównym serwerze, brak połączenia - failover na lokalny
  if (!isOnLocalServer && status === "offline") {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white px-4 py-3 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <WifiOff className="w-5 h-5 animate-pulse" />
            <div>
              <p className="font-medium">Brak połączenia z serwerem głównym!</p>
              <p className="text-sm opacity-90">
                {localServerAvailable
                  ? countdown > 0
                    ? `Przełączam na serwer lokalny za ${countdown}s...`
                    : "Przekierowuję na serwer lokalny..."
                  : "Oba serwery niedostępne - sprawdź połączenie sieciowe"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {localServerAvailable && (
              <>
                <button
                  onClick={handleCancelRedirect}
                  className="px-3 py-1.5 text-sm bg-red-700 hover:bg-red-800 rounded transition-colors"
                >
                  Anuluj
                </button>
                <button
                  onClick={() => (window.location.href = LOCAL_SERVER)}
                  className="px-3 py-1.5 text-sm bg-white text-red-700 hover:bg-red-50 rounded font-medium flex items-center gap-1 transition-colors"
                >
                  Przejdź teraz
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
```

---

## 14. src/components/OfflineIndicator.tsx

```typescript
"use client";

import { useEffect, useState } from "react";
import { WifiOff, CloudOff, RefreshCw, AlertTriangle, Check } from "lucide-react";
import { useOfflineStore } from "@/store/useOfflineStore";
import { syncPendingActions, getSyncStatus } from "@/lib/offline/sync";

interface SyncStatus {
  pending: number;
  failed: number;
  lastSync: string | null;
  inProgress: boolean;
}

export function OfflineIndicator() {
  const isOnline = useOfflineStore((s) => s.isOnline);
  const pendingCount = useOfflineStore((s) => s.pendingActions.length);
  const failedCount = useOfflineStore((s) => s.failedPermanently.length);
  const syncInProgress = useOfflineStore((s) => s.syncInProgress);
  
  const [showDetails, setShowDetails] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  useEffect(() => {
    if (syncResult) {
      const timer = setTimeout(() => setSyncResult(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [syncResult]);

  const handleManualSync = async () => {
    if (syncInProgress || !isOnline) return;
    
    const result = await syncPendingActions();
    
    if (result.synced > 0) {
      setSyncResult(`Zsynchronizowano ${result.synced} ${result.synced === 1 ? "akcję" : "akcji"}`);
    } else if (result.failed > 0) {
      setSyncResult(`${result.failed} ${result.failed === 1 ? "błąd" : "błędów"} synchronizacji`);
    }
  };

  if (isOnline && pendingCount === 0 && failedCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-[9998]">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg transition-all
          ${!isOnline 
            ? "bg-red-600 text-white" 
            : pendingCount > 0 
              ? "bg-yellow-500 text-white"
              : failedCount > 0
                ? "bg-orange-500 text-white"
                : "bg-gray-600 text-white"
          }
        `}
      >
        {!isOnline ? (
          <WifiOff className="w-4 h-4" />
        ) : syncInProgress ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : failedCount > 0 ? (
          <AlertTriangle className="w-4 h-4" />
        ) : (
          <CloudOff className="w-4 h-4" />
        )}
        
        <span className="text-sm font-medium">
          {!isOnline 
            ? "Offline" 
            : syncInProgress
              ? "Synchronizuję..."
              : pendingCount > 0
                ? `${pendingCount} oczekujących`
                : `${failedCount} błędów`
          }
        </span>
      </button>

      {showDetails && (
        <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">Status synchronizacji</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isOnline ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}>
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
          
          <div className="p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Oczekujące akcje:</span>
              <span className={`font-medium ${pendingCount > 0 ? "text-yellow-600" : "text-gray-900"}`}>
                {pendingCount}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Błędy trwałe:</span>
              <span className={`font-medium ${failedCount > 0 ? "text-red-600" : "text-gray-900"}`}>
                {failedCount}
              </span>
            </div>
            
            {syncResult && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                <Check className="w-3 h-3" />
                {syncResult}
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-gray-100 flex gap-2">
            <button
              onClick={handleManualSync}
              disabled={!isOnline || syncInProgress || pendingCount === 0}
              className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
            >
              {syncInProgress ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              Synchronizuj
            </button>
            
            {failedCount > 0 && (
              <button
                onClick={() => useOfflineStore.getState().clearFailedActions()}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
              >
                Wyczyść błędy
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Podsumowanie AUDIT-PART2

### Pliki offline/sync:
- `src/lib/offline/sync.ts` — 264 linie — silnik synchronizacji z exponential backoff, timeout, priority

### Pliki fiskalne:
- `src/lib/fiscal/posnet-driver.ts` — 266 linii — driver Posnet (DEMO/LIVE, TCP)
- `src/lib/fiscal/types.ts` — 64 linie — typy dla modułu fiskalnego

### Pliki płatności:
- `src/lib/hooks/usePolcardGo.ts` — 224 linie — hook do integracji z PolCard Go SoftPOS
- `src/lib/hooks/useWebNfc.ts` — 123 linie — hook do Web NFC API
- `src/lib/payment-terminal/client.ts` — 517 linii — klient terminala (Stripe/PolCard/DEMO)
- `src/lib/payment-terminal/types.ts` — 99 linii — typy dla terminali płatniczych

### Pliki e-paragonów:
- `src/lib/e-receipt/generator.ts` — 170 linii — generator HTML e-paragonu
- `src/lib/e-receipt/qr.ts` — 15 linii — generator kodów QR

### Kluczowe API routes:
- `src/app/api/orders/[id]/close/route.ts` — 222 linie — zamykanie zamówienia + fiskalizacja
- `src/app/api/payments/route.ts` — 103 linie — rejestracja płatności
- `src/app/api/fiscal/route.ts` — 136 linii — status drukarki + raport dobowy

### Komponenty UI offline:
- `src/components/ConnectionMonitor.tsx` — 331 linii — inteligentny failover cloud↔local
- `src/components/OfflineIndicator.tsx` — 149 linii — wskaźnik synchronizacji offline

### Łącznie w AUDIT-PART2: ~2683 linie kodu
