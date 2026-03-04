"use client";

import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { useFloorFromDexie, type TableView } from "@/hooks/useFloorFromDexie";
import { hydrateOrderFromApiCreate } from "@/lib/orders/order-actions";
import { backgroundRefresh, syncOpenOrders } from "@/lib/db/initial-sync";
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
  Hotel,
  RefreshCw,
  LayoutGrid,
  CalendarCheck,
} from "lucide-react";

type TableStatus = "FREE" | "OCCUPIED" | "BILL_REQUESTED" | "RESERVED" | "BANQUET_MODE" | "INACTIVE";

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
  FREE: { bg: "bg-brand-brown hover:brightness-110 border-[#704a2f] text-white shadow-[#895a3a]/30", label: "Wolny" },
  OCCUPIED: { bg: "bg-brand-gold hover:brightness-110 border-[#c9a03d] text-brand-dark shadow-[#d8af44]/30", label: "Zajęty" },
  BILL_REQUESTED: { bg: "bg-rose-500 hover:bg-rose-600 border-rose-600 text-white shadow-rose-500/40 animate-pulse ring-2 ring-rose-400/50", label: "Rachunek" },
  RESERVED: { bg: "bg-brand-dark/80 hover:bg-brand-dark border-[#2a3538] text-white/80 shadow-[#0a0f10]/25", label: "Rezerwacja" },
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
                  <div className="bg-brand-blue" style={{ flex: table.kitchenStatus.served }} />
                )}
                {table.kitchenStatus.ready > 0 && (
                  <div className="bg-brand-gold animate-pulse" style={{ flex: table.kitchenStatus.ready }} />
                )}
                {table.kitchenStatus.inProgress > 0 && (
                  <div className="bg-brand-brown" style={{ flex: table.kitchenStatus.inProgress }} />
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

const TABLE_W = 80;
const TABLE_H = 60;
const TABLE_GAP = 20;

/** Kompaktowa karta stolika dla widoku planu sali */
const FloorPlanTableCard = memo(function FloorPlanTableCard({
  table,
  displayShape,
  displaySeats,
  onClick,
  onHover,
  onContextAction,
  style,
}: {
  table: TableView;
  displayShape?: "rect" | "oval";
  displaySeats?: number;
  onClick: () => void;
  onHover?: () => void;
  onContextAction?: (action: "bill" | "move" | "open") => void;
  style: React.CSSProperties;
}) {
  const cfg = STATUS_CONFIG[table.status];
  const hasOrder = !!table.activeOrder;
  const hasReservation = !hasOrder && !!table.nextReservation;
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const shapeClass =
    displayShape === "oval"
      ? "rounded-[9999px]"
      : "rounded-lg";

  return (
    <>
      <button
        type="button"
        className={cn(
          "absolute flex flex-col items-center justify-center border-2 p-1 transition-all duration-150 active:scale-95 shadow-md",
          shapeClass,
          cfg.bg
        )}
        style={style}
        onClick={() => { if (!contextMenu) onClick(); }}
        onMouseEnter={onHover}
        onTouchStart={onHover}
        onContextMenu={(e) => {
          if (hasOrder) {
            e.preventDefault();
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setContextMenu({ x: rect.left + rect.width / 2, y: rect.bottom });
          }
        }}
        disabled={table.status === "INACTIVE"}
      >
        {hasOrder && table.assignedUserInitials && (
          <span className="absolute left-0.5 top-0.5 rounded bg-black/30 px-1 text-[8px] font-bold">
            {table.assignedUserInitials}
          </span>
        )}
        {table.hasKitchenAlert && (
          <span className="absolute right-0.5 top-0.5">
            <BellRing className="h-3 w-3 animate-bounce" />
          </span>
        )}
        <span className="font-mono text-sm font-black leading-none">{table.number}</span>
        <span className="text-[9px] opacity-80">{displaySeats ?? table.seats} os.</span>
        {hasOrder && (
          <span className="text-[9px] font-bold tabular-nums">{table.activeOrder!.totalGross.toFixed(0)} zł</span>
        )}
        {!hasOrder && !hasReservation && table.status === "FREE" && (
          <span className="text-[8px] uppercase opacity-70">{cfg.label}</span>
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
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-muted"
              onClick={() => { setContextMenu(null); onContextAction?.("bill"); }}
            >
              <CreditCard className="h-3 w-3" /> Rachunek
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-muted"
              onClick={() => { setContextMenu(null); onContextAction?.("move"); }}
            >
              <ArrowRightLeft className="h-3 w-3" /> Przenieś
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-muted"
              onClick={() => { setContextMenu(null); onClick(); }}
            >
              <ShoppingBag className="h-3 w-3" /> Otwórz
            </button>
          </div>
        </>
      )}
    </>
  );
});

FloorPlanTableCard.displayName = "FloorPlanTableCard";

/**
 * Preset układu BistroMo: 4 kolumny, prostokąty 6-os. (1–8), owale 4-os. (9+).
 * Kolumna 1: 5,6,7,8 | Kolumna 2: 9,10(,14,15) | Kolumna 3: 13,12,11 | Kolumna 4: 4,3,2,1
 */
const BISTROMO_PRESET: Record<
  number,
  { col: number; row: number; shape: "rect" | "oval" }
> = {
  5: { col: 0, row: 0, shape: "rect" },
  6: { col: 0, row: 1, shape: "rect" },
  7: { col: 0, row: 2, shape: "rect" },
  8: { col: 0, row: 3, shape: "rect" },
  9: { col: 1, row: 0, shape: "oval" },
  10: { col: 1, row: 1, shape: "oval" },
  14: { col: 1, row: 2, shape: "oval" },
  15: { col: 1, row: 3, shape: "oval" },
  13: { col: 2, row: 0, shape: "oval" },
  12: { col: 2, row: 1, shape: "oval" },
  11: { col: 2, row: 2, shape: "oval" },
  4: { col: 3, row: 0, shape: "rect" },
  3: { col: 3, row: 1, shape: "rect" },
  2: { col: 3, row: 2, shape: "rect" },
  1: { col: 3, row: 3, shape: "rect" },
};

const RECT_W = 92;
const RECT_H = 52;
const OVAL_W = 78;
const OVAL_H = 44;
const COL_GAP = 48;
const ROW_GAP = 52;
const PLAN_PAD = 24;

function useFloorPlanLayout(tables: TableView[]) {
  return useMemo(() => {
    if (tables.length === 0) return { positions: new Map(), canvasW: 400, canvasH: 300 };
    const tableNumbers = new Set(tables.map((t) => t.number));
    const usePreset =
      tables.length >= 13 &&
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].every((n) => tableNumbers.has(n));

    const positions = new Map<string, { x: number; y: number; w: number; h: number; displayShape: "rect" | "oval"; displaySeats: number }>();

    if (usePreset) {
      const colX = [
        PLAN_PAD,
        PLAN_PAD + RECT_W + COL_GAP,
        PLAN_PAD + RECT_W + COL_GAP + OVAL_W + COL_GAP,
        PLAN_PAD + RECT_W + COL_GAP + OVAL_W + COL_GAP + OVAL_W + COL_GAP,
      ];
      tables.forEach((t) => {
        const preset = BISTROMO_PRESET[t.number];
        if (!preset) return;
        const w = preset.shape === "rect" ? RECT_W : OVAL_W;
        const h = preset.shape === "rect" ? RECT_H : OVAL_H;
        const x = colX[preset.col];
        const y = PLAN_PAD + preset.row * (ROW_GAP + RECT_H);
        const displaySeats = preset.shape === "rect" ? 6 : 4;
        positions.set(t.id, { x, y, w, h, displayShape: preset.shape, displaySeats });
      });
      const canvasW = PLAN_PAD * 2 + 2 * RECT_W + 2 * OVAL_W + 3 * COL_GAP;
      const canvasH = PLAN_PAD * 2 + 4 * RECT_H + 3 * ROW_GAP;
      return { positions, canvasW, canvasH };
    }

    const hasAnyPosition = tables.some((t) => t.positionX !== 0 || t.positionY !== 0);

    if (hasAnyPosition) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      const temp = new Map<string, { x: number; y: number; w: number; h: number }>();
      for (const t of tables) {
        const w = t.width ?? (t.shape === "ROUND" ? 56 : t.shape === "LONG" ? 120 : TABLE_W);
        const h = t.height ?? (t.shape === "ROUND" ? 56 : TABLE_H);
        temp.set(t.id, { x: t.positionX, y: t.positionY, w, h });
        minX = Math.min(minX, t.positionX);
        minY = Math.min(minY, t.positionY);
        maxX = Math.max(maxX, t.positionX + w);
        maxY = Math.max(maxY, t.positionY + h);
      }
      const pad = 24;
      const canvasW = Math.max(400, maxX - minX + pad * 2);
      const canvasH = Math.max(300, maxY - minY + pad * 2);
      const displayShape = (t: TableView): "rect" | "oval" =>
        t.shape === "ROUND" ? "oval" : "rect";
      Array.from(temp.entries()).forEach(([id, p]) => {
        const t = tables.find((x) => x.id === id);
        positions.set(id, {
          x: p.x - minX + pad,
          y: p.y - minY + pad,
          w: p.w,
          h: p.h,
          displayShape: t ? displayShape(t) : "rect",
          displaySeats: t?.seats ?? 4,
        });
      });
      return { positions, canvasW, canvasH };
    }

    const cols = Math.ceil(Math.sqrt(tables.length));
    const sorted = [...tables].sort((a, b) => a.number - b.number);
    let maxX = 0, maxY = 0;
    const displayShape = (t: TableView): "rect" | "oval" =>
      t.shape === "ROUND" ? "oval" : "rect";
    sorted.forEach((t, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const w = t.width ?? (t.shape === "ROUND" ? 56 : t.shape === "LONG" ? 120 : TABLE_W);
      const h = t.height ?? (t.shape === "ROUND" ? 56 : TABLE_H);
      const x = col * (TABLE_W + TABLE_GAP) + TABLE_GAP;
      const y = row * (TABLE_H + TABLE_GAP) + TABLE_GAP;
      positions.set(t.id, { x, y, w, h, displayShape: displayShape(t), displaySeats: t.seats });
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    });
    const pad = 24;
    return { positions, canvasW: maxX + pad, canvasH: maxY + pad };
  }, [tables]);
}

function FloorPlanView({
  tables,
  roomId,
  onTableClick,
  onTableHover,
  onContextAction,
}: {
  tables: TableView[];
  roomId: string;
  onTableClick: (table: TableView, roomId: string) => void;
  onTableHover: (table: TableView) => void;
  onContextAction: (table: TableView, action: "bill" | "move" | "open") => void;
}) {
  const { positions, canvasW, canvasH } = useFloorPlanLayout(tables);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const s = Math.min(r.width / canvasW, r.height / canvasH);
      setScale(Math.max(0.3, s));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [canvasW, canvasH]);

  return (
    <div
      ref={containerRef}
      className="flex h-full min-h-0 w-full items-center justify-center overflow-hidden bg-muted/20 px-2 py-2"
    >
      <div
        className="relative shrink-0"
        style={{
          width: canvasW * scale,
          height: canvasH * scale,
        }}
      >
        <div
          className="absolute inset-0 origin-top-left"
          style={{
            width: canvasW,
            height: canvasH,
            transform: `scale(${scale})`,
            backgroundImage: "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        >
        {tables.map((table) => {
          const pos = positions.get(table.id);
          if (!pos) return null;
          return (
            <FloorPlanTableCard
              key={table.id}
              table={table}
              displayShape={pos.displayShape}
              displaySeats={pos.displaySeats}
              onClick={() => onTableClick(table, roomId)}
              onHover={() => onTableHover(table)}
              onContextAction={(action) => onContextAction(table, action)}
              style={{ position: "absolute", left: pos.x, top: pos.y, width: pos.w, height: pos.h }}
            />
          );
        })}
        </div>
      </div>
    </div>
  );
}

type OpenShiftItem = { id: string; userId: string; userName: string; startedAt: string; cashStart: number; turnover: number; expectedCash?: number };

export function PosPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [guestDialog, setGuestDialog] = useState<{ tableId: string; roomId: string; tableNumber: number; seats: number } | null>(null);
  const [guestCount, setGuestCount] = useState("2");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [time, setTime] = useState("");
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [isResetting, setIsResetting] = useState(false);
  const [tableViewMode, setTableViewMode] = useState<"grid" | "floorPlan">("grid");

  // Zamknięcie zmiany — widoczne dla kelnera (nie ownera) z otwartą zmianą
  const [closeShiftDialogOpen, setCloseShiftDialogOpen] = useState(false);
  const [closeCashEnd, setCloseCashEnd] = useState("");
  const [closeHandoverTo, setCloseHandoverTo] = useState("");

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

  // P24-FIX: Sync open orders from server on mount to prevent "table occupied" errors
  useEffect(() => {
    syncOpenOrders().catch((e) => console.warn("[POS] Failed to sync open orders:", e));
  }, []);

  // Dexie — floor (rooms + tables + orders) — offline-first
  const { rooms: dexieRooms, isLoading } = useFloorFromDexie();

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

  const { data: myOpenShifts = [] } = useQuery<OpenShiftItem[]>({
    queryKey: ["shifts-open", currentUser?.id],
    queryFn: async () => {
      const res = await fetch(`/api/shifts?status=OPEN&userId=${currentUser!.id}`);
      if (!res.ok) throw new Error("Błąd");
      return res.json();
    },
    enabled: !!currentUser && !currentUser.isOwner,
  });

  const myOpenShift = myOpenShifts[0] ?? null;

  const { data: usersForHandover = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["users-for-handover"],
    queryFn: async () => {
      const res = await fetch("/api/users?all=true");
      if (!res.ok) throw new Error("Błąd");
      return res.json();
    },
    enabled: closeShiftDialogOpen,
  });

  const closeShiftMutation = useMutation({
    mutationFn: async ({
      shiftId,
      cashEnd,
      handoverToUserId,
    }: {
      shiftId: string;
      cashEnd?: number;
      handoverToUserId?: string;
    }) => {
      const res = await fetch(`/api/shifts/${shiftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CLOSED",
          cashEnd: cashEnd ?? undefined,
          handoverToUserId: handoverToUserId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd zamknięcia zmiany");
      return data;
    },
    onSuccess: () => {
      setCloseShiftDialogOpen(false);
      setCloseCashEnd("");
      setCloseHandoverTo("");
      queryClient.invalidateQueries({ queryKey: ["shifts-open"] });
    },
  });

  const rooms = dexieRooms;
  const alerts = (alertsData?.alerts ?? []).filter(a => !dismissedAlerts.has(a.id));

  useEffect(() => {
    if (rooms.length && !selectedRoomId) {
      setSelectedRoomId(rooms[0].id);
    }
  }, [rooms, selectedRoomId]);

  const selectedRoom = useMemo(() => {
    const found = rooms.find((r) => r.id === selectedRoomId);
    return found ?? rooms[0] ?? null;
  }, [rooms, selectedRoomId]);

  // Data comes from Dexie — no prefetch needed
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const prefetchOrder = useCallback((_orderId: string) => {}, []);

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
      if (table.status === "FREE" || !table.activeOrder) {
        // P22-FIX: Also allow opening guest dialog if table has no active order
        // (handles edge case where table.status is stale but no order exists)
        setGuestDialog({ tableId: table.id, roomId, tableNumber: table.number, seats: table.seats });
        setGuestCount(String(Math.min(2, table.seats)));
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

  const handleStartOrderWithCount = async (count: number) => {
    if (!guestDialog || !currentUser) return;
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
          guestCount: count,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error ?? "Błąd tworzenia zamówienia");
        setCreating(false);
        // P24-FIX: Sync open orders when server says table is occupied (stale local data)
        if (data.error?.includes("zajęty") || data.error?.includes("occupied")) {
          syncOpenOrders().catch(() => {});
        }
        return;
      }
      setGuestDialog(null);
      await hydrateOrderFromApiCreate({
        serverId: data.order.id,
        orderNumber: data.order.orderNumber,
        type: "DINE_IN",
        tableId: guestDialog.tableId,
        roomId: guestDialog.roomId,
        userId: currentUser.id,
        userName: currentUser.name ?? "",
        guestCount: count,
      });
      router.push(`/pos/order/${data.order.id}`);
    } catch {
      setCreateError("Błąd połączenia");
      setCreating(false);
    }
  };

  const handleStartOrder = async () => {
    if (!guestDialog || !currentUser) return;
    const num = parseInt(guestCount, 10);
    if (Number.isNaN(num) || num < 1) {
      setCreateError("Podaj liczbę gości (min 1)");
      return;
    }
    if (num > guestDialog.seats) {
      setCreateError(`Stolik mieści max ${guestDialog.seats} osób`);
      return;
    }
    await handleStartOrderWithCount(num);
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
      await hydrateOrderFromApiCreate({
        serverId: data.order.id,
        orderNumber: data.order.orderNumber,
        type: "TAKEAWAY",
        userId: currentUser.id,
        userName: currentUser.name ?? "",
        guestCount: 1,
      });
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

  const handleResetLocalData = async () => {
    if (!confirm("Wyczyścić CAŁĄ lokalną bazę danych?\n\nUżyj tego jeśli stoliki wyświetlają się nieprawidłowo.\n\nDane na serwerze NIE zostaną usunięte.")) {
      return;
    }
    setIsResetting(true);
    try {
      // 1. Usuwamy całą bazę IndexedDB
      const dbName = "PosKarczma";
      await new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase(dbName);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
      });

      // 2. Czyścimy cache Service Workera (jeśli istnieje)
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      // 3. Wyrejestrowujemy Service Workery
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }

      alert("Baza lokalna usunięta. Strona zostanie odświeżona.");
      
      // 4. Pełne przeładowanie z ominięciem cache (cache-bust via timestamp)
      window.location.href = window.location.pathname + "?reset=" + Date.now();
    } catch (e) {
      alert("Błąd: " + (e instanceof Error ? e.message : "Nieznany błąd"));
    } finally {
      setIsResetting(false);
    }
  };

  // Kitchen alerts count for bottom bar badge
  const kitchenAlertsCount = alerts.filter(a => a.type === "KITCHEN_READY").length;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        <div className="flex items-center gap-2 border-b bg-card px-3 py-2 sm:px-4">
          <div className="relative h-8 w-10 flex-shrink-0">
            <Image src="/logo.png" alt="Łabędź" fill className="object-contain object-left" unoptimized />
          </div>
          <span className="text-sm font-semibold text-foreground">Karczma Łabędź</span>
          <span className="flex-1" />
          <span className="font-mono text-lg font-semibold tabular-nums text-foreground">{time}</span>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Ładowanie mapy sal…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* === TOP BAR === */}
      <div className="flex flex-wrap items-center gap-2 border-b bg-card px-3 py-2 sm:px-4">
        <div className="relative mr-1 h-8 w-10 flex-shrink-0">
          <Image src="/logo.png" alt="Łabędź" fill className="object-contain object-left" unoptimized />
        </div>
        <div className="flex flex-1 flex-wrap gap-1.5">
          {rooms.map((room) => {
            const isActive = selectedRoomId === room.id;
            const hasAlerts = room.stats.withAlerts > 0;
            return (
              <button
                key={room.id}
                type="button"
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
                        : "bg-brand-brown text-white"
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

      {/* === TABLE GRID lub PLAN SALI === */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <p className="text-lg font-medium text-muted-foreground">Ładowanie sal i stolików…</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <p className="text-lg font-medium text-muted-foreground">Brak sal i stolików</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Skonfiguruj sale i stoliki w ustawieniach, żeby móc przyjmować zamówienia.
              Jeśli sale istniały wcześniej, mogły zostać wyłączone — sprawdź w Ustawieniach → Sale.
            </p>
            {currentUser?.isOwner && (
              <Button onClick={() => router.push("/settings/rooms")} variant="default">
                <Settings className="mr-2 h-4 w-4" />
                Przejdź do ustawień
              </Button>
            )}
          </div>
        ) : selectedRoom ? (
          // Sale są, ale brak stolików w cache (sync tables mógł się nie powieść)
          rooms.reduce((s, r) => s + r.tables.length, 0) === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
              <p className="text-lg font-medium text-muted-foreground">Stoliki nie zostały załadowane</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Dane offline mogą być niekompletne. Przejdź do Ustawień i kliknij „Resetuj cache offline”, żeby pobrać stoliki z serwera.
              </p>
              <Button onClick={() => router.push("/settings")} variant="default">
                <Settings className="mr-2 h-4 w-4" />
                Ustawienia
              </Button>
            </div>
          ) : tableViewMode === "grid" ? (
            <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
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
            </div>
          ) : (
            <FloorPlanView
              tables={selectedRoom.tables}
              roomId={selectedRoom.id}
              onTableClick={handleTableClick}
              onTableHover={handleTableHover}
              onContextAction={(table, action) => {
                if (!table.activeOrder) return;
                const orderId = table.activeOrder.id;
                if (action === "bill") router.push(`/pos/order/${orderId}?action=bill`);
                else if (action === "move") router.push(`/pos/order/${orderId}?action=move`);
                else if (action === "open") router.push(`/pos/order/${orderId}`);
              }}
            />
          )
        ) : null}
      </div>

      {/* === BOTTOM ACTION BAR === */}
      <div className="flex flex-wrap items-center gap-2 border-t bg-card px-3 py-2 sm:px-4 sm:py-3">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-1.5 text-xs sm:text-sm",
            pathname === "/pos"
              ? "bg-brand-brown/10 border-brand-brown/30 hover:bg-brand-brown/20"
              : ""
          )}
          onClick={() => {
            if (pathname === "/pos") {
              setTableViewMode((prev) => (prev === "grid" ? "floorPlan" : "grid"));
            } else {
              router.push("/pos");
            }
          }}
          title={tableViewMode === "grid" ? "Plan sali (układ stolików)" : "Siatka stolików"}
        >
          <LayoutGrid className="h-4 w-4" />
          <span className="hidden sm:inline">
            {tableViewMode === "grid" ? "Stoliki" : "Plan sali"}
          </span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs sm:text-sm bg-brand-brown/10 border-brand-brown/30 hover:bg-brand-brown/20"
          onClick={() => router.push("/hotel-orders")}
        >
          <Hotel className="h-4 w-4" />
          <span className="hidden sm:inline">Hotel</span>
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

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-muted-foreground sm:text-sm"
          onClick={handleResetLocalData}
          disabled={isResetting}
        >
          <RefreshCw className={cn("h-4 w-4", isResetting && "animate-spin")} />
          <span className="hidden sm:inline">{isResetting ? "Reset..." : "Reset"}</span>
        </Button>
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
        {myOpenShift && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs sm:text-sm"
            onClick={() => {
              setCloseCashEnd(myOpenShift.expectedCash != null ? String(myOpenShift.expectedCash) : "");
              setCloseHandoverTo("");
              setCloseShiftDialogOpen(true);
            }}
          >
            <CalendarCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Zamknij zmianę</span>
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
              Stolik {guestDialog?.tableNumber} (max {guestDialog?.seats} os.) — ile gości?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: Math.min(8, guestDialog?.seats ?? 8) }, (_, i) => i + 1).map((n) => (
                <Button
                  key={n}
                  variant={guestCount === String(n) ? "default" : "outline"}
                  className="h-12 text-lg font-bold"
                  disabled={creating}
                  onClick={() => {
                    setGuestCount(String(n));
                    handleStartOrderWithCount(n);
                  }}
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
                max={guestDialog?.seats ?? 99}
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className="w-20 text-center"
              />
              <Button
                size="sm"
                onClick={handleStartOrder}
                disabled={creating || !guestCount}
              >
                OK
              </Button>
            </div>
            {createError && (
              <p className="text-sm text-destructive">{createError}</p>
            )}
          </div>
          <DialogFooter className="sm:justify-center">
            <Button variant="outline" onClick={() => setGuestDialog(null)}>
              Anuluj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === ZAMKNIĘCIE ZMIANY === */}
      <Dialog open={closeShiftDialogOpen} onOpenChange={(o) => !o && setCloseShiftDialogOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Zamknij zmianę</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Koniec zmiany — wpisz stan gotówki i opcjonalnie przekaż stoliki innemu kelnerowi.</p>
          <div className="space-y-4 py-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Stan końcowy gotówki (zł)</label>
              <Input
                type="number"
                step="0.01"
                value={closeCashEnd}
                onChange={(e) => setCloseCashEnd(e.target.value)}
                placeholder={myOpenShift?.expectedCash != null ? String(myOpenShift.expectedCash) : "0"}
              />
            </div>
            {closeShiftMutation.isError && (
              <p className="text-sm text-destructive">
                {closeShiftMutation.error instanceof Error ? closeShiftMutation.error.message : "Błąd zamknięcia"}
              </p>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium">Przekaż otwarte stoliki do</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={closeHandoverTo}
                onChange={(e) => setCloseHandoverTo(e.target.value)}
              >
                <option value="">— Nie przekazuj —</option>
                {usersForHandover
                  .filter((u) => u.id !== currentUser?.id)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                Wybrany kelner przejmie Twoje otwarte zamówienia i stoliki.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCloseShiftDialogOpen(false)}
              disabled={closeShiftMutation.isPending}
            >
              Anuluj
            </Button>
            <Button
              onClick={() => {
                if (!myOpenShift) return;
                const cashEndNum = parseFloat(closeCashEnd);
                closeShiftMutation.mutate({
                  shiftId: myOpenShift.id,
                  cashEnd: !isNaN(cashEndNum) ? cashEndNum : undefined,
                  handoverToUserId: closeHandoverTo || undefined,
                });
              }}
              disabled={closeShiftMutation.isPending}
            >
              {closeShiftMutation.isPending ? "Zamykanie…" : "Zamknij zmianę"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
