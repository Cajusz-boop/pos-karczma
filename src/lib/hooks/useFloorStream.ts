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
    try {
      const res = await fetch("/api/pos/floor");
      if (!res.ok) throw new Error("Błąd pobierania");
      const data = await res.json();
      setRooms(data.rooms ?? []);
      setLastUpdate(new Date());
      setError(null);
      setIsLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd połączenia");
    }
  }, []);

  const connect = useCallback(() => {
    if (!enabled || typeof window === "undefined") return;
    
    cleanup();
    
    if (!("EventSource" in window)) {
      fallbackIntervalRef.current = setInterval(fetchFallback, fallbackPollingMs);
      fetchFallback();
      return;
    }
    
    const eventSource = new EventSource("/api/pos/floor/stream");
    eventSourceRef.current = eventSource;
    
    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data: FloorEvent = JSON.parse(event.data);
        
        if (data.type === "floor" && data.rooms) {
          setRooms(data.rooms);
          setLastUpdate(data.timestamp ? new Date(data.timestamp) : new Date());
          setIsLoading(false);
        } else if (data.type === "error") {
          setError(data.message ?? "Błąd serwera");
        }
      } catch (e) {
        console.error("[SSE] Parse error:", e);
      }
    };
    
    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
      eventSourceRef.current = null;
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };
  }, [enabled, cleanup, fetchFallback, fallbackPollingMs]);

  useEffect(() => {
    connect();
    return cleanup;
  }, [connect, cleanup]);

  useEffect(() => {
    if (!enabled) {
      cleanup();
      setRooms([]);
      setIsConnected(false);
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
