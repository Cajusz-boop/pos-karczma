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
    try {
      const res = await fetch(`/api/kds/${stationId}/orders`);
      if (!res.ok) throw new Error("Błąd pobierania");
      const data = await res.json();
      setActive(data.active ?? []);
      setServed(data.served ?? []);
      setLastUpdate(new Date());
      setError(null);
      setIsLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd połączenia");
    }
  }, [stationId]);

  const connect = useCallback(() => {
    if (!enabled || !stationId || typeof window === "undefined") return;

    cleanup();

    if (!("EventSource" in window)) {
      fallbackIntervalRef.current = setInterval(fetchFallback, fallbackPollingMs);
      fetchFallback();
      return;
    }

    const eventSource = new EventSource(`/api/kds/${stationId}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.addEventListener("orders", (event) => {
      try {
        const data: KdsOrdersEvent = JSON.parse(event.data);
        setActive(data.active);
        setServed(data.served);
        setLastUpdate(data.timestamp ? new Date(data.timestamp) : new Date());
        setIsLoading(false);
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

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    });

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
      eventSourceRef.current = null;

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };
  }, [enabled, stationId, cleanup, fetchFallback, fallbackPollingMs]);

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
