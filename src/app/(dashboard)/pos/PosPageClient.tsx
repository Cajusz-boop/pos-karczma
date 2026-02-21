"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { useAuthStore } from "@/store/useAuthStore";
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
} from "lucide-react";

type TableShape = "RECTANGLE" | "ROUND" | "LONG";
type TableStatus = "FREE" | "OCCUPIED" | "BILL_REQUESTED" | "RESERVED" | "BANQUET_MODE" | "INACTIVE";

type TableRow = {
  id: string;
  number: number;
  seats: number;
  shape: TableShape;
  status: TableStatus;
  positionX: number;
  positionY: number;
  activeOrder: {
    id: string;
    orderNumber: number;
    createdAt: string;
    totalGross: number;
    userName: string;
  } | null;
  reservation?: {
    id: string;
    timeFrom: string;
    guestName: string;
    status: string;
  } | null;
};

type RoomRow = {
  id: string;
  name: string;
  capacity: number;
  type: string;
  isSeasonal: boolean;
  sortOrder: number;
  tables: TableRow[];
};

const STATUS_CONFIG: Record<TableStatus, { bg: string; label: string }> = {
  FREE: { bg: "bg-emerald-500 hover:bg-emerald-600 border-emerald-600 text-white shadow-emerald-500/25", label: "Wolny" },
  OCCUPIED: { bg: "bg-amber-500 hover:bg-amber-600 border-amber-600 text-white shadow-amber-500/25", label: "Zajęty" },
  BILL_REQUESTED: { bg: "bg-rose-500 hover:bg-rose-600 border-rose-600 text-white shadow-rose-500/25 animate-pulse", label: "Rachunek" },
  RESERVED: { bg: "bg-slate-400 hover:bg-slate-500 border-slate-500 text-white shadow-slate-400/25", label: "Rezerwacja" },
  BANQUET_MODE: { bg: "bg-blue-500 hover:bg-blue-600 border-blue-600 text-white shadow-blue-500/25", label: "Bankiet" },
  INACTIVE: { bg: "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed", label: "Nieaktywny" },
};

function TableCard({ table, onClick, onHover, onContextAction }: {
  table: TableRow;
  onClick: () => void;
  onHover?: () => void;
  onContextAction?: (action: "bill" | "move" | "open") => void;
}) {
  const cfg = STATUS_CONFIG[table.status];
  const hasOrder = !!table.activeOrder;
  const hasReservation = !hasOrder && !!table.reservation;
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
        "min-h-[110px] sm:min-h-[120px] md:min-h-[130px]",
        table.shape === "ROUND" && "rounded-full aspect-square min-h-0",
        table.shape === "LONG" && "col-span-2 min-h-[90px] rounded-xl",
        cfg.bg
      )}
    >
      <span className="text-2xl font-black tabular-nums leading-none sm:text-3xl">
        {table.number}
      </span>
      <span className="mt-0.5 text-[11px] font-medium opacity-80 sm:text-xs">
        <Users className="mr-0.5 inline h-3 w-3" />
        {table.seats}
      </span>

      {hasOrder && (
        <div className="mt-1 flex flex-col items-center gap-0.5">
          <span className="text-lg font-bold tabular-nums leading-tight sm:text-xl">
            {table.activeOrder!.totalGross.toFixed(2)} zł
          </span>
          <span className="flex items-center gap-1 text-[10px] opacity-80 sm:text-xs">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(table.activeOrder!.createdAt), {
              addSuffix: false,
              locale: pl,
            })}
          </span>
          <span className="text-[10px] font-medium opacity-70 sm:text-xs">
            {table.activeOrder!.userName}
          </span>
        </div>
      )}

      {hasReservation && (
        <div className="mt-1 flex flex-col items-center gap-0.5">
          <span className="text-xs font-semibold">{table.reservation!.timeFrom}</span>
          <span className="text-[10px] opacity-80">{table.reservation!.guestName}</span>
        </div>
      )}

      {!hasOrder && !hasReservation && table.status === "FREE" && (
        <span className="mt-1 text-[10px] font-medium uppercase tracking-wider opacity-60 sm:text-xs">
          {cfg.label}
        </span>
      )}
    </button>
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
}

function StatusLegend() {
  const items: { status: TableStatus; label: string; color: string }[] = [
    { status: "FREE", label: "Wolny", color: "bg-emerald-500" },
    { status: "OCCUPIED", label: "Zajęty", color: "bg-amber-500" },
    { status: "BILL_REQUESTED", label: "Rachunek", color: "bg-rose-500" },
    { status: "RESERVED", label: "Rezerwacja", color: "bg-slate-400" },
    { status: "BANQUET_MODE", label: "Bankiet", color: "bg-blue-500" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      {items.map((i) => (
        <span key={i.status} className="flex items-center gap-1.5">
          <span className={cn("inline-block h-3 w-3 rounded-sm", i.color)} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

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

  const today = new Date().toISOString().slice(0, 10);
  const { data: rooms = [], isLoading } = useQuery<RoomRow[]>({
    queryKey: ["rooms", today],
    queryFn: async () => {
      const res = await fetch(`/api/rooms?date=${today}`);
      if (!res.ok) throw new Error("Błąd pobierania sal");
      return res.json();
    },
    refetchInterval: 5_000,
  });

  useEffect(() => {
    if (rooms.length && !selectedRoomId) setSelectedRoomId(rooms[0].id);
  }, [rooms, selectedRoomId]);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? rooms[0];

  const stats = {
    occupied: selectedRoom?.tables.filter((t) => t.status === "OCCUPIED").length ?? 0,
    free: selectedRoom?.tables.filter((t) => t.status === "FREE").length ?? 0,
    billRequested: selectedRoom?.tables.filter((t) => t.status === "BILL_REQUESTED").length ?? 0,
    total: selectedRoom?.tables.length ?? 0,
  };

  const prefetchOrder = useCallback(
    (orderId: string) => {
      queryClient.prefetchQuery({
        queryKey: ["order", orderId],
        queryFn: async () => {
          const res = await fetch(`/api/orders/${orderId}`);
          if (!res.ok) throw new Error("Błąd");
          return res.json();
        },
        staleTime: 10000,
      });
      queryClient.prefetchQuery({
        queryKey: ["products"],
        queryFn: async () => {
          const res = await fetch("/api/products");
          if (!res.ok) throw new Error("Błąd");
          return res.json();
        },
        staleTime: 60000,
      });
    },
    [queryClient]
  );

  const handleTableHover = useCallback(
    (table: TableRow) => {
      if (table.activeOrder) {
        prefetchOrder(table.activeOrder.id);
      }
    },
    [prefetchOrder]
  );

  const handleTableClick = useCallback(
    (table: TableRow, roomId: string) => {
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
      {/* === TOP BAR: Room tabs + clock + user === */}
      <div className="flex flex-wrap items-center gap-2 border-b bg-card px-3 py-2 sm:px-4">
        <div className="flex flex-1 flex-wrap gap-1.5">
          {rooms.map((room) => {
            const isActive = selectedRoomId === room.id;
            const occupiedCount = room.tables.filter((t) => t.status !== "FREE" && t.status !== "INACTIVE").length;
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
                {occupiedCount > 0 && (
                  <span className={cn(
                    "ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                    isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-amber-500 text-white"
                  )}>
                    {occupiedCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-sm sm:gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {stats.free} wolnych / {stats.total}
          </span>
          <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
            {time}
          </span>
          <span className="hidden font-medium text-foreground sm:inline">
            {currentUser?.name}
          </span>
        </div>
      </div>

      {/* === TABLE GRID === */}
      <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
        {selectedRoom && (
          <>
            <div className="mb-3 hidden sm:block">
              <StatusLegend />
            </div>
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
          </>
        )}
      </div>

      {/* === BOTTOM ACTION BAR === */}
      <div className="flex flex-wrap items-center gap-2 border-t bg-card px-3 py-2 sm:px-4 sm:py-3">
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
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs sm:text-sm"
          onClick={() => router.push("/kitchen")}
        >
          <ChefHat className="h-4 w-4" />
          <span className="hidden sm:inline">Kuchnia</span>
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
