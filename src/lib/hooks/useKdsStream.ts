"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface KdsItem {
  id: string;
  productName: string;
  quantity: number;
  note: string | null;
  modifiersJson: unknown;
  courseNumber: number;
  status: string;
  isModifiedAfterSend: boolean;
  cancelReason: string | null;
}

interface KdsActiveOrder {
  orderId: string;
  orderNumber: number;
  tableNumber: number | null;
  type: string;
  courseReleasedUpTo: number;
  waiterName: string;
  guestCount: number;
  banquetName: string | null;
  sentAt: string | null;
  items: KdsItem[];
}

interface KdsServedOrder {
  orderId: string;
  orderNumber: number;
  tableNumber: number | null;
  type: string;
  waiterName: string;
  servedAt: string;
  items: string[];
}

interface KdsOrdersEvent {
  active: KdsActiveOrder[];
  served: KdsServedOrder[];
  timestamp: string;
}

interface UseKdsStreamOptions {
  stationId: string | null;
  enabled?: boolean;
  fallbackPollingMs?: number;
}

interface UseKdsStreamResult {
  active: KdsActiveOrder[];
  served: KdsServedOrder[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

const MIN_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 60000;
const MAX_SSE_FAILURES_BEFORE_FALLBACK = 3;

function calculateBackoff(attempt: number): number {
  const delay = MIN_RECONNECT_DELAY * Math.pow(2, attempt);
  const jitter = Math.random() * 1000;
  return Math.min(delay + jitter, MAX_RECONNECT_DELAY);
}

export function useKdsStream(options: UseKdsStreamOptions): UseKdsStreamResult {
  const { stationId, enabled = true, fallbackPollingMs = 3000 } = options;

  const [active, setActive] = useState<KdsActiveOrder[]>([]);
  const [served, setServed] = useState<KdsServedOrder[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const failedAttemptsRef = useRef(0);
  const isUsingFallbackRef = useRef(false);

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
  }, []);

  const fetchFallback = useCallback(async () => {
    if (!stationId) return;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const res = await fetch(`/api/kds/${stationId}/orders`, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!res.ok) throw new Error("Błąd pobierania");
      const data = await res.json();
      setActive(data.active ?? []);
      setServed(data.served ?? []);
      setLastUpdate(new Date());
      setError(null);
      setIsLoading(false);
    } catch (e) {
      clearTimeout(timeoutId);
      if (e instanceof Error && e.name === "AbortError") {
        setError("Przekroczono limit czasu połączenia");
      } else {
        setError(e instanceof Error ? e.message : "Błąd połączenia");
      }
      setIsLoading(false);
    }
  }, [stationId]);

  const startFallbackPolling = useCallback(() => {
    if (isUsingFallbackRef.current) return;
    isUsingFallbackRef.current = true;
    fallbackIntervalRef.current = setInterval(fetchFallback, fallbackPollingMs);
    fetchFallback();
  }, [fetchFallback, fallbackPollingMs]);

  const connect = useCallback(() => {
    if (!enabled || !stationId || typeof window === "undefined") return;

    cleanup();
    isUsingFallbackRef.current = false;

    if (!("EventSource" in window)) {
      startFallbackPolling();
      return;
    }

    const eventSource = new EventSource(`/api/kds/${stationId}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
      failedAttemptsRef.current = 0;
    };

    eventSource.addEventListener("orders", (event) => {
      try {
        const data: KdsOrdersEvent = JSON.parse(event.data);
        setActive(data.active);
        setServed(data.served);
        setLastUpdate(data.timestamp ? new Date(data.timestamp) : new Date());
        setIsLoading(false);
        failedAttemptsRef.current = 0;
      } catch (e) {
        console.error("[SSE KDS] Parse error:", e);
      }
    });

    eventSource.addEventListener("error", (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        setError(data.message ?? "Błąd serwera");
      } catch {
        setIsConnected(false);
        eventSource.close();
        eventSourceRef.current = null;
        failedAttemptsRef.current += 1;

        if (failedAttemptsRef.current >= MAX_SSE_FAILURES_BEFORE_FALLBACK) {
          startFallbackPolling();
          return;
        }

        const backoffDelay = calculateBackoff(failedAttemptsRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, backoffDelay);
      }
    });

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
      eventSourceRef.current = null;
      failedAttemptsRef.current += 1;

      if (failedAttemptsRef.current >= MAX_SSE_FAILURES_BEFORE_FALLBACK) {
        startFallbackPolling();
        return;
      }

      const backoffDelay = calculateBackoff(failedAttemptsRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, backoffDelay);
    };
  }, [enabled, stationId, cleanup, fetchFallback, fallbackPollingMs, startFallbackPolling]);

  useEffect(() => {
    connect();
    return cleanup;
  }, [connect, cleanup]);

  useEffect(() => {
    if (!enabled || !stationId) {
      cleanup();
      setActive([]);
      setServed([]);
      setIsConnected(false);
      isUsingFallbackRef.current = false;
    }
  }, [enabled, stationId, cleanup]);

  return {
    active,
    served,
    isConnected,
    isLoading,
    error,
    lastUpdate,
  };
}
