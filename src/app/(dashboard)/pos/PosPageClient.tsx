"use client";

import { useState, useEffect, useCallback, useRef, memo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { useFloorStream } from "@/lib/hooks/useFloorStream";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ShoppingBag,
  Receipt,
  ClipboardList,
  Users,
  Clock,
  LogOut,
  ChefHat,
  Settings,
  CreditCard,
  ArrowRightLeft,
  BellRing,
  AlertTriangle,
  CalendarClock,
  X,
} from "lucide-react";

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
  capacity: number;
  type: string;
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

interface FloorResponse {
  rooms: RoomView[];
  meta: { timestamp: string; queryTimeMs: number };
}

interface PosAlert {
  id: string;
  type: string;
  tableId: string;
  tableNumber: number;
  roomId: string;
  message: string;
  createdAt: string;
  priority: number;
  orderId?: string;
}

interface AlertsResponse {
  alerts: PosAlert[];
  meta: { timestamp: string; queryTimeMs: number; count: number };
}

const STATUS_CONFIG: Record<TableStatus, { bg: string; label: string }> = {
  FREE: { bg: "bg-emerald-500 hover:bg-emerald-600 border-emerald-600 text-white shadow-emerald-500/25", label: "Wolny" },
  OCCUPIED: { bg: "bg-amber-500 hover:bg-amber-600 border-amber-600 text-white shadow-amber-500/25", label: "Zajęty" },
  BILL_REQUESTED: { bg: "bg-rose-500 hover:bg-rose-600 border-rose-600 text-white shadow-rose-500/25 animate-pulse", label: "Rachunek" },
  RESERVED: { bg: "bg-violet-500 hover:bg-violet-600 border-violet-600 text-white shadow-violet-500/25", label: "Rezerwacja" },
  BANQUET_MODE: { bg: "bg-blue-500 hover:bg-blue-600 border-blue-600 text-white shadow-blue-500/25", label: "Bankiet" },
  INACTIVE: { bg: "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed", label: "Nieaktywny" },
};

function getTimeColor(minutes: number): string {
  if (minutes < 15) return "text-emerald-300";
  if (minutes < 30) return "text-amber-300";
  if (minutes < 45) return "text-orange-300";
  return "text-rose-300 animate-pulse";
}

const AlertBar = memo(function AlertBar({ 
  alerts, 
  onAlertClick, 
  onDismiss 
}: { 
  alerts: PosAlert[]; 
  onAlertClick: (alert: PosAlert) => void;
  onDismiss: (alertId: string) => void;
}) {
  if (alerts.length === 0) return null;

  const getAlertStyle = (type: string) => {
    switch (type) {
      case "KITCHEN_READY":
        return { icon: BellRing, bg: "bg-rose-500/15", text: "text-rose-400" };
      case "RESERVATION_CONFLICT":
        return { icon: AlertTriangle, bg: "bg-rose-500/15", text: "text-rose-400" };
      case "BILL_REQUESTED":
        return { icon: Receipt, bg: "bg-amber-500/15", text: "text-amber-400" };
      case "LONG_WAIT":
        return { icon: Clock, bg: "bg-amber-500/15", text: "text-amber-400" };
      case "NEEDS_ATTENTION":
        return { icon: AlertTriangle, bg: "bg-amber-500/15", text: "text-amber-400" };
      case "RESERVATION_SOON":
        return { icon: CalendarClock, bg: "bg-violet-500/15", text: "text-violet-400" };
      default:
        return { icon: AlertTriangle, bg: "bg-slate-500/15", text: "text-slate-400" };
    }
  };

  return (
    <div className="flex h-11 items-center gap-2 overflow-x-auto border-b border-border/50 bg-muted/30 px-3">
      {alerts.map((alert) => {
        const style = getAlertStyle(alert.type);
        const Icon = style.icon;
        return (
          <button
            key={alert.id}
            onClick={() => onAlertClick(alert)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors",
              style.bg,
              style.text,
              "hover:brightness-125"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">{alert.message}</span>
            <X
              className="h-3.5 w-3.5 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(alert.id);
              }}
            />
          </button>
        );
      })}
    </div>
  );
});

AlertBar.displayName = "AlertBar";

const TableCard = memo(function TableCard({ 
  table, 
  onClick, 
  onHover, 
  onContextAction 
}: {
  table: TableView;
  onClick: () => void;
  onHover?: () => void;
  onContextAction?: (action: "bill" | "move" | "open") => void;
}) {
  const cfg = STATUS_CONFIG[table.status];
  const hasOrder = !!table.activeOrder;
  const hasReservation = !hasOrder && !!table.nextReservation;
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!hasOrder) return;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    longPressTimer.current = setTimeout(() => {
      setContextMenu({ x: rect.left + rect.width / 2, y: rect.bottom });
    }, 500);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => { if (!contextMenu) onClick(); }}
        onMouseEnter={onHover}
        onTouchStart={onHover}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onContextMenu={(e) => {
          if (hasOrder) {
            e.preventDefault();
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setContextMenu({ x: rect.left + rect.width / 2, y: rect.bottom });
          }
        }}
        disabled={table.status === "INACTIVE"}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 p-2 transition-all duration-150 active:scale-95 shadow-lg",
          "min-h-[120px] sm:min-h-[130px] md:min-h-[140px]",
          table.shape === "ROUND" && "rounded-full aspect-square min-h-0",
          table.shape === "LONG" && "col-span-2 min-h-[90px] rounded-xl",
          cfg.bg
        )}
      >
        {/* Inicjały kelnera */}
        {hasOrder && table.assignedUserInitials && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-black/20 px-1.5 py-0.5 text-[10px] font-bold">
            {table.assignedUserInitials}
          </span>
        )}

        {/* Kitchen alert */}
        {table.hasKitchenAlert && (
          <span className="absolute right-1.5 top-1.5">
            <BellRing className="h-4 w-4 animate-bounce" />
          </span>
        )}

        {/* Needs attention */}
        {table.needsAttention && !table.hasKitchenAlert && (
          <span className="absolute right-1.5 top-1.5">
            <AlertTriangle className="h-4 w-4 animate-pulse" />
          </span>
        )}

        {/* Numer stolika */}
        <span className={cn(
          "font-mono font-black tabular-nums leading-none",
          hasOrder ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl opacity-80"
        )}>
          {table.number}
        </span>

        {/* Miejsca */}
        <span className="mt-0.5 flex items-center gap-1 text-[11px] opacity-70 sm:text-xs">
          <Users className="h-3 w-3" />
          {table.seats}
        </span>

        {/* Zajęty: kwota + czas + progress */}
        {hasOrder && (
          <div className="mt-1 flex flex-col items-center gap-0.5">
            <span className="font-mono text-base font-bold tabular-nums sm:text-lg">
              {table.activeOrder!.totalGross.toFixed(2)} zł
            </span>
            {table.timing && (
              <span className={cn(
                "flex items-center gap-1 text-[10px] font-medium sm:text-xs",
                getTimeColor(table.timing.minutesSinceLastInteraction)
              )}>
                <Clock className="h-3 w-3" />
                {table.timing.minutesSinceLastInteraction}&apos;
              </span>
            )}

            {/* Progress bar */}
            {table.kitchenStatus && table.activeOrder!.itemCount > 0 && (
              <div className="mt-1 flex h-1 w-14 gap-0.5 overflow-hidden rounded-full sm:w-16">
                {table.kitchenStatus.served > 0 && (
                  <div className="bg-emerald-400" style={{ flex: table.kitchenStatus.served }} />
                )}
                {table.kitchenStatus.ready > 0 && (
                  <div className="bg-rose-400 animate-pulse" style={{ flex: table.kitchenStatus.ready }} />
                )}
                {table.kitchenStatus.inProgress > 0 && (
                  <div className="bg-amber-400" style={{ flex: table.kitchenStatus.inProgress }} />
                )}
                {table.kitchenStatus.ordered > 0 && (
                  <div className="bg-white/30" style={{ flex: table.kitchenStatus.ordered }} />
                )}
              </div>
            )}
          </div>
        )}

        {/* Rezerwacja */}
        {hasReservation && (
          <div className="mt-1 flex flex-col items-center gap-0.5">
            <span className="text-xs font-semibold">{table.nextReservation!.timeFrom}</span>
            <span className="text-[10px] opacity-80">{table.nextReservation!.guestName}</span>
            {table.nextReservation!.minutesUntil < 30 && (
              <span className="text-[9px] text-amber-300">za {table.nextReservation!.minutesUntil} min</span>
            )}
          </div>
        )}

        {/* Wolny */}
        {!hasOrder && !hasReservation && table.status === "FREE" && (
          <span className="mt-1 text-[10px] font-medium uppercase tracking-wider opacity-50 sm:text-xs">
            {cfg.label}
          </span>
        )}
      </button>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 animate-in fade-in-0 zoom-in-95 rounded-lg border bg-card p-1 shadow-xl"
            style={{
              left: Math.min(contextMenu.x - 70, window.innerWidth - 160),
              top: Math.min(contextMenu.y + 4, window.innerHeight - 120),
            }}
          >
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted"
              onClick={() => { setContextMenu(null); onContextAction?.("bill"); }}
            >
              <CreditCard className="h-4 w-4" />
              Rachunek
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted"
              onClick={() => { setContextMenu(null); onContextAction?.("move"); }}
            >
              <ArrowRightLeft className="h-4 w-4" />
              Przenieś
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted"
              onClick={() => { setContextMenu(null); onClick(); }}
            >
              <ShoppingBag className="h-4 w-4" />
              Otwórz
            </button>
          </div>
        </>
      )}
    </>
  );
});

TableCard.displayName = "TableCard";

export function PosPageClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [guestDialog, setGuestDialog] = useState<{ tableId: string; roomId: string; tableNumber: number } | null>(null);
  const [guestCount, setGuestCount] = useState("2");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [time, setTime] = useState("");
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("pl-PL", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  // Real-time floor data via SSE (Server-Sent Events)
  const { rooms: sseRooms, isLoading: sseLoading, isConnected } = useFloorStream({ enabled: true });
  
  // Fallback to polling if SSE not available (kept for compatibility)
  const { data: floorData } = useQuery<FloorResponse>({
    queryKey: ["floor"],
    queryFn: async () => {
      const res = await fetch("/api/pos/floor");
      if (!res.ok) throw new Error("Błąd pobierania mapy");
      return res.json();
    },
    refetchInterval: isConnected ? false : 5_000,
    staleTime: 3_000,
    refetchOnWindowFocus: false,
    enabled: !isConnected,
  });
  
  const isLoading = sseLoading && !floorData;

  // Fetch alerts
  const { data: alertsData } = useQuery<AlertsResponse>({
    queryKey: ["alerts", currentUser?.id],
    queryFn: async () => {
      const params = currentUser?.id ? `?userId=${currentUser.id}` : "";
      const res = await fetch(`/api/pos/alerts${params}`);
      if (!res.ok) throw new Error("Błąd alertów");
      return res.json();
    },
    refetchInterval: 3_000,
    staleTime: 2_000,
    enabled: !!currentUser,
    refetchOnWindowFocus: false,
  });

  const rooms = isConnected ? sseRooms : (floorData?.rooms ?? []);
  const alerts = (alertsData?.alerts ?? []).filter(a => !dismissedAlerts.has(a.id));

  useEffect(() => {
    if (rooms.length && !selectedRoomId) setSelectedRoomId(rooms[0].id);
  }, [rooms, selectedRoomId]);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? rooms[0];

  const prefetchOrder = useCallback(
    (orderId: string) => {
      queryClient.prefetchQuery({
        queryKey: ["order", orderId],
        queryFn: async () => {
          const res = await fetch(`/api/orders/${orderId}`);
          if (!res.ok) throw new Error("Błąd");
          return res.json();
        },
        staleTime: 10_000,
      });
      queryClient.prefetchQuery({
        queryKey: ["products"],
        queryFn: async () => {
          const res = await fetch("/api/products");
          if (!res.ok) throw new Error("Błąd");
          return res.json();
        },
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient]
  );

  const handleTableHover = useCallback(
    (table: TableView) => {
      if (table.activeOrder) {
        prefetchOrder(table.activeOrder.id);
      }
    },
    [prefetchOrder]
  );

  const handleTableClick = useCallback(
    (table: TableView, roomId: string) => {
      if (table.status === "FREE") {
        setGuestDialog({ tableId: table.id, roomId, tableNumber: table.number });
        setGuestCount("2");
        setCreateError("");
      } else if (table.activeOrder) {
        prefetchOrder(table.activeOrder.id);
        router.push(`/pos/order/${table.activeOrder.id}`);
      }
    },
    [router, prefetchOrder]
  );

  const handleAlertClick = useCallback(
    (alert: PosAlert) => {
      // Przejdź do sali ze stolikiem
      if (alert.roomId !== selectedRoomId) {
        setSelectedRoomId(alert.roomId);
      }
      // Jeśli jest orderId, otwórz zamówienie
      if (alert.orderId) {
        router.push(`/pos/order/${alert.orderId}`);
      }
    },
    [selectedRoomId, router]
  );

  const handleDismissAlert = useCallback((alertId: string) => {
    setDismissedAlerts(prev => new Set([...Array.from(prev), alertId]));
  }, []);

  const handleStartOrder = async () => {
    if (!guestDialog || !currentUser) return;
    const num = parseInt(guestCount, 10);
    if (Number.isNaN(num) || num < 1) {
      setCreateError("Podaj liczbę gości (min 1)");
      return;
    }
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: guestDialog.tableId,
          roomId: guestDialog.roomId,
          userId: currentUser.id,
          guestCount: num,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error ?? "Błąd tworzenia zamówienia");
        setCreating(false);
        return;
      }
      setGuestDialog(null);
      queryClient.invalidateQueries({ queryKey: ["floor"] });
      router.push(`/pos/order/${data.order.id}`);
    } catch {
      setCreateError("Błąd połączenia");
    } finally {
      setCreating(false);
    }
  };

  const handleTakeaway = async () => {
    if (!currentUser) return;
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          guestCount: 1,
          type: "TAKEAWAY",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error ?? "Błąd tworzenia zamówienia na wynos");
        setCreating(false);
        return;
      }
      router.push(`/pos/order/${data.order.id}`);
    } catch {
      setCreateError("Błąd połączenia");
    } finally {
      setCreating(false);
    }
  };

  const handleQuickReceipt = async () => {
    if (!currentUser) return;
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          guestCount: 1,
          type: "TAKEAWAY",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error ?? "Błąd tworzenia szybkiego paragonu");
        setCreating(false);
        return;
      }
      router.push(`/pos/order/${data.order.id}?quick=true`);
    } catch {
      setCreateError("Błąd połączenia");
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  // Kitchen alerts count for bottom bar badge
  const kitchenAlertsCount = alerts.filter(a => a.type === "KITCHEN_READY").length;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Ładowanie mapy sal…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* === TOP BAR === */}
      <div className="flex flex-wrap items-center gap-2 border-b bg-card px-3 py-2 sm:px-4">
        <div className="flex flex-1 flex-wrap gap-1.5">
          {rooms.map((room) => {
            const isActive = selectedRoomId === room.id;
            const hasAlerts = room.stats.withAlerts > 0;
            return (
              <button
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={cn(
                  "relative rounded-lg px-3 py-2 text-sm font-semibold transition-all sm:px-4 sm:py-2.5 sm:text-base",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                )}
              >
                {room.name}
                {(room.stats.occupied + room.stats.billRequested) > 0 && (
                  <span className={cn(
                    "ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                    hasAlerts 
                      ? "bg-rose-500 text-white animate-pulse"
                      : isActive 
                        ? "bg-primary-foreground/20 text-primary-foreground" 
                        : "bg-amber-500 text-white"
                  )}>
                    {room.stats.occupied + room.stats.billRequested}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-sm sm:gap-3">
          {selectedRoom && (
            <>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {selectedRoom.stats.free} wolnych / {selectedRoom.stats.total}
              </span>
              <span className="hidden font-mono text-xs font-semibold text-emerald-500 sm:inline">
                {selectedRoom.stats.totalRevenue.toFixed(0)} zł
              </span>
            </>
          )}
          <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
            {time}
          </span>
          <span className="hidden font-medium text-foreground sm:inline">
            {currentUser?.name}
          </span>
        </div>
      </div>

      {/* === ALERT BAR === */}
      <AlertBar 
        alerts={alerts} 
        onAlertClick={handleAlertClick}
        onDismiss={handleDismissAlert}
      />

      {/* === TABLE GRID === */}
      <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
        {selectedRoom && (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {selectedRoom.tables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onClick={() => handleTableClick(table, selectedRoom.id)}
                onHover={() => handleTableHover(table)}
                onContextAction={(action) => {
                  if (!table.activeOrder) return;
                  const orderId = table.activeOrder.id;
                  if (action === "bill") {
                    router.push(`/pos/order/${orderId}?action=bill`);
                  } else if (action === "move") {
                    router.push(`/pos/order/${orderId}?action=move`);
                  } else if (action === "open") {
                    router.push(`/pos/order/${orderId}`);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* === BOTTOM ACTION BAR === */}
      <div className="flex flex-wrap items-center gap-2 border-t bg-card px-3 py-2 sm:px-4 sm:py-3">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "relative gap-1.5 text-xs sm:text-sm",
            kitchenAlertsCount > 0 && "border-rose-500/50 text-rose-500"
          )}
          onClick={() => router.push("/kitchen")}
        >
          <ChefHat className="h-4 w-4" />
          <span className="hidden sm:inline">Kuchnia</span>
          {kitchenAlertsCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
              {kitchenAlertsCount}
            </span>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs sm:text-sm"
          onClick={handleTakeaway}
          disabled={creating}
        >
          <ShoppingBag className="h-4 w-4" />
          <span className="hidden sm:inline">Na wynos</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs sm:text-sm"
          onClick={handleQuickReceipt}
          disabled={creating}
        >
          <Receipt className="h-4 w-4" />
          <span className="hidden sm:inline">Szybki paragon</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs sm:text-sm"
          onClick={() => router.push("/orders")}
        >
          <ClipboardList className="h-4 w-4" />
          <span className="hidden sm:inline">Zamówienia</span>
        </Button>

        <div className="flex-1" />

        {currentUser?.isOwner && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground sm:text-sm"
            onClick={() => router.push("/settings")}
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Ustawienia</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-muted-foreground sm:text-sm"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Wyloguj</span>
        </Button>
      </div>

      {/* === GUEST COUNT DIALOG === */}
      <Dialog open={!!guestDialog} onOpenChange={(o) => !o && setGuestDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Stolik {guestDialog?.tableNumber} — ile gości?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <Button
                  key={n}
                  variant={guestCount === String(n) ? "default" : "outline"}
                  className="h-12 text-lg font-bold"
                  onClick={() => setGuestCount(String(n))}
                >
                  {n}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Inna liczba:</span>
              <Input
                type="number"
                min={1}
                max={99}
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className="w-20 text-center"
              />
            </div>
            {createError && (
              <p className="text-sm text-destructive">{createError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGuestDialog(null)}>
              Anuluj
            </Button>
            <Button
              onClick={handleStartOrder}
              disabled={creating}
              className="min-w-[120px]"
            >
              {creating ? "Tworzenie…" : `Rozpocznij (${guestCount} os.)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
