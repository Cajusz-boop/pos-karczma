"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type TableShape = "RECTANGLE" | "ROUND" | "LONG";
type TableStatus = "FREE" | "OCCUPIED" | "BILL_REQUESTED" | "RESERVED" | "BANQUET_MODE" | "INACTIVE";

interface KitchenStatus {
  ordered: number;
  inProgress: number;
  ready: number;
  served: number;
}

interface Timing {
  minutesSinceCreated: number;
  minutesSinceLastInteraction: number;
  minutesSinceLastKitchenEvent: number | null;
}

interface TableView {
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
    isVip: boolean;
  } | null;
  needsAttention: boolean;
  hasKitchenAlert: boolean;
}

interface RoomView {
  id: string;
  name: string;
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

interface FloorEvent {
  type: "floor" | "error";
  rooms?: RoomView[];
  timestamp?: string;
  message?: string;
}

interface UseFloorStreamOptions {
  enabled?: boolean;
  fallbackPollingMs?: number;
}

interface UseFloorStreamResult {
  rooms: RoomView[];
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

export function useFloorStream(options: UseFloorStreamOptions = {}): UseFloorStreamResult {
  const { enabled = true, fallbackPollingMs = 5000 } = options;
  
  const [rooms, setRooms] = useState<RoomView[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialLoadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    if (initialLoadTimeoutRef.current) {
      clearTimeout(initialLoadTimeoutRef.current);
      initialLoadTimeoutRef.current = null;
    }
  }, []);

  const fetchFallback = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const res = await fetch("/api/pos/floor", { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!res.ok) throw new Error("Błąd pobierania");
      const data = await res.json();
      setRooms(data.rooms ?? []);
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
  }, []);

  const startFallbackPolling = useCallback(() => {
    if (isUsingFallbackRef.current) return;
    isUsingFallbackRef.current = true;
    fallbackIntervalRef.current = setInterval(fetchFallback, fallbackPollingMs);
    fetchFallback();
  }, [fetchFallback, fallbackPollingMs]);

  const connect = useCallback(() => {
    if (!enabled || typeof window === "undefined") return;
    
    cleanup();
    isUsingFallbackRef.current = false;
    
    if (!("EventSource" in window)) {
      startFallbackPolling();
      return;
    }
    
    const eventSource = new EventSource("/api/pos/floor/stream");
    eventSourceRef.current = eventSource;
    
    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
      failedAttemptsRef.current = 0;
      
      initialLoadTimeoutRef.current = setTimeout(() => {
        initialLoadTimeoutRef.current = null;
        if (eventSourceRef.current && eventSource.readyState === EventSource.OPEN) {
          fetchFallback();
        }
      }, 4000);
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data: FloorEvent = JSON.parse(event.data);
        
        if (data.type === "floor" && data.rooms) {
          if (initialLoadTimeoutRef.current) {
            clearTimeout(initialLoadTimeoutRef.current);
            initialLoadTimeoutRef.current = null;
          }
          setRooms(data.rooms);
          setLastUpdate(data.timestamp ? new Date(data.timestamp) : new Date());
          setIsLoading(false);
          setError(null);
          failedAttemptsRef.current = 0;
        } else if (data.type === "error") {
          setError(data.message ?? "Błąd serwera");
          setIsLoading(false);
        }
      } catch (e) {
        console.error("[SSE] Parse error:", e);
      }
    };
    
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
  }, [enabled, cleanup, fetchFallback, startFallbackPolling]);

  useEffect(() => {
    connect();
    return cleanup;
  }, [connect, cleanup]);

  useEffect(() => {
    if (!enabled) {
      cleanup();
      setRooms([]);
      setIsConnected(false);
      isUsingFallbackRef.current = false;
    }
  }, [enabled, cleanup]);

  return {
    rooms,
    isConnected,
    isLoading,
    error,
    lastUpdate,
  };
}
