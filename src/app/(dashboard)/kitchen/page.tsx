"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Clock,
  User,
  UtensilsCrossed,
  Volume2,
  VolumeX,
  LayoutGrid,
  List,
  Monitor,
  AlertTriangle,
  ChefHat,
  Bell,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

type KDSStation = {
  id: string;
  name: string;
  displayOrder: number;
  categoryIds: string[];
};

type KDSCardItem = {
  id: string;
  productName: string;
  quantity: number;
  note: string | null;
  modifiersJson: unknown;
  courseNumber: number;
  status: string;
  isModifiedAfterSend: boolean;
  cancelReason: string | null;
};

type KDSCard = {
  orderId: string;
  orderNumber: number;
  tableNumber: number | null;
  type: string;
  courseReleasedUpTo: number;
  waiterName: string;
  guestCount: number;
  banquetName: string | null;
  sentAt: string | null;
  items: KDSCardItem[];
};

type KDSMessage = {
  id: string;
  message: string;
  orderId: string | null;
  tableId: string | null;
  readAt: string | null;
  createdAt: string;
};

type ViewMode = "tiled" | "allday" | "expo";
type FontSize = "sm" | "md" | "lg" | "xl";

// ============================================================
// TIMER & HELPERS
// ============================================================

const TIMER_THRESHOLDS = { warning: 10, alarm: 15 };

function getTimerState(sentAt: string | null): {
  minutes: number;
  color: "green" | "yellow" | "red";
} {
  if (!sentAt) return { minutes: 0, color: "green" };
  const minutes = Math.floor(
    (Date.now() - new Date(sentAt).getTime()) / 60_000
  );
  if (minutes < TIMER_THRESHOLDS.warning) return { minutes, color: "green" };
  if (minutes < TIMER_THRESHOLDS.alarm) return { minutes, color: "yellow" };
  return { minutes, color: "red" };
}

function formatModifiers(modifiersJson: unknown): string[] {
  if (!modifiersJson || !Array.isArray(modifiersJson)) return [];
  return (modifiersJson as { name?: string }[])
    .map((m) => m.name)
    .filter(Boolean) as string[];
}

const FONT_CLASSES: Record<FontSize, { table: string; item: string; qty: string; mod: string; note: string; timer: string; meta: string }> = {
  sm: { table: "text-2xl", item: "text-sm", qty: "text-base", mod: "text-xs", note: "text-xs", timer: "text-sm", meta: "text-xs" },
  md: { table: "text-3xl", item: "text-base", qty: "text-lg", mod: "text-sm", note: "text-sm", timer: "text-base", meta: "text-xs" },
  lg: { table: "text-4xl", item: "text-lg", qty: "text-xl", mod: "text-base", note: "text-base", timer: "text-lg", meta: "text-sm" },
  xl: { table: "text-5xl", item: "text-xl", qty: "text-2xl", mod: "text-lg", note: "text-lg", timer: "text-xl", meta: "text-base" },
};

// ============================================================
// KDS CARD COMPONENT (dark theme, research-based layout)
// ============================================================

function KDSOrderCard({
  card,
  onStart,
  onReady,
  fontSize,
}: {
  card: KDSCard;
  onStart: (orderId: string, itemIds: string[]) => void;
  onReady: (orderId: string, itemIds: string[]) => void;
  fontSize: FontSize;
}) {
  const timer = getTimerState(card.sentAt);
  const allReady = card.items.every((i) => i.status === "READY" || i.status === "CANCELLED");
  const hasInProgress = card.items.some((i) => i.status === "IN_PROGRESS");
  const hasStarted = hasInProgress || allReady;
  const activeItems = card.items.filter((i) => i.status !== "CANCELLED");
  const f = FONT_CLASSES[fontSize];

  const headerColor =
    allReady
      ? "bg-emerald-600"
      : timer.color === "red"
        ? "bg-red-600 animate-pulse"
        : timer.color === "yellow"
          ? "bg-amber-600"
          : hasStarted
            ? "bg-blue-600"
            : "bg-slate-600";

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl overflow-hidden border border-slate-700 shadow-xl transition-all",
        timer.color === "red" && !allReady && "ring-2 ring-red-500"
      )}
    >
      {/* === HEADER: table number + timer (colored by status) === */}
      <div className={cn("flex items-center justify-between px-4 py-2", headerColor)}>
        <div className="flex items-center gap-3">
          <span className={cn("font-black text-white tabular-nums", f.table)}>
            {card.tableNumber != null
              ? card.tableNumber
              : card.banquetName ?? `#${card.orderNumber}`}
          </span>
          {card.tableNumber != null && (
            <span className="text-sm font-medium text-white/70">
              Stolik
            </span>
          )}
          {card.type === "BANQUET" && (
            <span className="rounded bg-white/20 px-2 py-0.5 text-sm font-semibold text-white">
              Kurs {card.courseReleasedUpTo}
            </span>
          )}
          {card.type === "TAKEAWAY" && (
            <span className="rounded bg-white/20 px-2 py-0.5 text-sm font-semibold text-white">
              NA WYNOS
            </span>
          )}
        </div>
        <div className={cn("flex items-center gap-1.5 font-bold tabular-nums text-white", f.timer)}>
          <Clock className="h-4 w-4" />
          {timer.minutes}m
        </div>
      </div>

      {/* === META: waiter + guest count === */}
      <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-800/50 px-4 py-1.5">
        <User className="h-3.5 w-3.5 text-slate-400" />
        <span className={cn("text-slate-300", f.meta)}>
          {card.waiterName}
        </span>
        {card.guestCount > 0 && (
          <span className={cn("text-slate-500", f.meta)}>
            · {card.guestCount} os.
          </span>
        )}
        <span className={cn("ml-auto text-slate-500", f.meta)}>
          #{card.orderNumber}
        </span>
      </div>

      {/* === ITEMS LIST === */}
      <div className="flex-1 bg-slate-900 px-3 py-2">
        <ul className="space-y-1.5">
          {card.items.map((item) => (
            <li key={item.id}>
              {item.cancelReason ? (
                <div className="rounded bg-red-900/40 px-2 py-1 line-through">
                  <span className={cn("text-red-400", f.item)}>
                    ANULOWANO: {item.productName}
                  </span>
                  <span className={cn("block text-red-500/80", f.mod)}>
                    {item.cancelReason}
                  </span>
                </div>
              ) : (
                <div
                  className={cn(
                    "rounded px-2 py-1",
                    item.isModifiedAfterSend && "bg-amber-900/30 border-l-4 border-amber-500"
                  )}
                >
                  {item.isModifiedAfterSend && (
                    <span className={cn("font-bold text-amber-400 block", f.mod)}>
                      <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                      ZMIANA
                    </span>
                  )}
                  <div className="flex items-baseline gap-2">
                    {/* Quantity BEFORE name (research: cook needs to know HOW MANY first) */}
                    <span className={cn("font-black text-amber-400 tabular-nums shrink-0", f.qty)}>
                      {item.quantity}x
                    </span>
                    <span className={cn("font-bold text-white", f.item)}>
                      {item.productName}
                    </span>
                  </div>
                  {/* Modifiers in distinct color (cyan) */}
                  {formatModifiers(item.modifiersJson).map((mod, i) => (
                    <div key={i} className={cn("ml-8 text-cyan-400", f.mod)}>
                      + {mod}
                    </div>
                  ))}
                  {/* Notes in amber */}
                  {item.note && (
                    <div className={cn("ml-8 italic text-amber-300", f.note)}>
                      — &quot;{item.note}&quot;
                    </div>
                  )}
                  {/* Course number */}
                  {item.courseNumber > 1 && (
                    <span className={cn("ml-8 text-slate-500", f.mod)}>
                      Kurs {item.courseNumber}
                    </span>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* === ACTION BUTTONS (large touch targets, min 60px) === */}
      <div className="flex gap-0 border-t border-slate-700">
        {!hasStarted && (
          <button
            type="button"
            onClick={() => {
              const ids = card.items
                .filter((i) => i.status === "SENT")
                .map((i) => i.id);
              if (ids.length) onStart(card.orderId, ids);
            }}
            className="flex flex-1 items-center justify-center gap-2 bg-amber-600 py-4 text-lg font-bold text-white transition-colors hover:bg-amber-500 active:bg-amber-700"
          >
            <ChefHat className="h-5 w-5" />
            ZACZYNAM
          </button>
        )}
        {hasInProgress && (
          <button
            type="button"
            onClick={() => {
              const ids = card.items
                .filter((i) => i.status === "IN_PROGRESS")
                .map((i) => i.id);
              if (ids.length) onReady(card.orderId, ids);
            }}
            className="flex flex-1 items-center justify-center gap-2 bg-emerald-600 py-4 text-lg font-bold text-white transition-colors hover:bg-emerald-500 active:bg-emerald-700"
          >
            <Bell className="h-5 w-5" />
            GOTOWE
          </button>
        )}
        {allReady && (
          <div className="flex flex-1 items-center justify-center gap-2 bg-emerald-800 py-4 text-lg font-bold text-emerald-300">
            <UtensilsCrossed className="h-5 w-5" />
            DO ODBIORU
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// ALL-DAY COUNT VIEW
// ============================================================

function AllDayCountView({
  cards,
  fontSize,
}: {
  cards: KDSCard[];
  fontSize: FontSize;
}) {
  const f = FONT_CLASSES[fontSize];

  const counts = useMemo(() => {
    const map = new Map<string, { name: string; total: number; modifiers: Map<string, number> }>();
    for (const card of cards) {
      for (const item of card.items) {
        if (item.status === "CANCELLED") continue;
        const key = item.productName;
        let entry = map.get(key);
        if (!entry) {
          entry = { name: item.productName, total: 0, modifiers: new Map() };
          map.set(key, entry);
        }
        entry.total += item.quantity;
        for (const mod of formatModifiers(item.modifiersJson)) {
          entry.modifiers.set(mod, (entry.modifiers.get(mod) ?? 0) + item.quantity);
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [cards]);

  if (counts.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-slate-500">
        <p className="text-xl">Brak aktywnych zamówień</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {counts.map((c) => (
          <div
            key={c.name}
            className="flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-800 px-5 py-4"
          >
            <span className={cn("font-black text-amber-400 tabular-nums", f.table)}>
              {c.total}x
            </span>
            <div>
              <span className={cn("font-bold text-white", f.item)}>
                {c.name}
              </span>
              {c.modifiers.size > 0 && (
                <div className="mt-0.5">
                  {Array.from(c.modifiers.entries()).map(([mod, qty]) => (
                    <span key={mod} className={cn("block text-cyan-400", f.mod)}>
                      + {mod} ({qty}x)
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// EXPO VIEW (only orders where ALL items are ready)
// ============================================================

function ExpoView({
  cards,
  fontSize,
}: {
  cards: KDSCard[];
  fontSize: FontSize;
}) {
  const f = FONT_CLASSES[fontSize];

  const readyOrders = useMemo(
    () =>
      cards.filter((c) =>
        c.items.every((i) => i.status === "READY" || i.status === "CANCELLED")
      ),
    [cards]
  );

  if (readyOrders.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-slate-500">
        <p className="text-xl">Brak zamówień do wydania</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {readyOrders.map((card) => (
          <div
            key={card.orderId}
            className="rounded-xl border-2 border-emerald-500 bg-emerald-900/20 p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className={cn("font-black text-emerald-400 tabular-nums", f.table)}>
                {card.tableNumber != null
                  ? `Stolik ${card.tableNumber}`
                  : `#${card.orderNumber}`}
              </span>
              <span className={cn("text-slate-400", f.meta)}>
                {card.waiterName}
              </span>
            </div>
            <ul className="space-y-0.5">
              {card.items
                .filter((i) => i.status !== "CANCELLED")
                .map((item) => (
                  <li key={item.id} className={cn("text-white", f.item)}>
                    <span className="font-bold text-amber-400">{item.quantity}x</span>{" "}
                    {item.productName}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MAIN KDS PAGE
// ============================================================

export default function KitchenPage() {
  const [stationId, setStationId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("tiled");
  const [fontSize, setFontSize] = useState<FontSize>("lg");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [alarmPlaying, setAlarmPlaying] = useState(false);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const prevOrderCountRef = useRef(0);

  // --- Data fetching ---

  const { data: stations = [] } = useQuery<KDSStation[]>({
    queryKey: ["kds-stations"],
    queryFn: async () => {
      const r = await fetch("/api/kds/stations");
      if (!r.ok) throw new Error("Błąd stacji");
      return r.json();
    },
  });

  useEffect(() => {
    if (stations.length && !stationId) setStationId(stations[0].id);
  }, [stations, stationId]);

  const { data: ordersData, refetch: refetchOrders } = useQuery<{
    active: KDSCard[];
    served: Array<{
      orderId: string;
      orderNumber: number;
      tableNumber: number | null;
      type: string;
      waiterName: string;
      servedAt: string;
      items: string[];
    }>;
  }>({
    queryKey: ["kds-orders", stationId],
    queryFn: async () => {
      if (!stationId) return { active: [], served: [] };
      const r = await fetch(`/api/kds/${stationId}/orders`);
      if (!r.ok) throw new Error("Błąd zamówień");
      return r.json();
    },
    refetchInterval: 3000,
    enabled: !!stationId,
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery<KDSMessage[]>({
    queryKey: ["kds-messages"],
    queryFn: async () => {
      const r = await fetch("/api/kds/messages?read=false");
      if (!r.ok) throw new Error("Błąd wiadomości");
      return r.json();
    },
    refetchInterval: 5000,
  });

  const active = ordersData?.active ?? [];
  const served = ordersData?.served ?? [];
  const unreadCount = messages.filter((m) => !m.readAt).length;
  const hasRedCard = active.some((c) => getTimerState(c.sentAt).color === "red");

  // --- Sound: new order ding ---
  useEffect(() => {
    if (!soundEnabled) return;
    const currentCount = active.length;
    if (currentCount > prevOrderCountRef.current && prevOrderCountRef.current > 0) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.value = 0.3;
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.frequency.value = 1100;
          gain2.gain.value = 0.3;
          osc2.start();
          osc2.stop(ctx.currentTime + 0.15);
        }, 180);
      } catch { /* audio not available */ }
    }
    prevOrderCountRef.current = currentCount;
  }, [active.length, soundEnabled]);

  // --- Sound: alarm for late orders ---
  useEffect(() => {
    if (!soundEnabled) {
      if (alarmAudioRef.current) {
        alarmAudioRef.current.pause();
        alarmAudioRef.current = null;
        setAlarmPlaying(false);
      }
      return;
    }
    if (hasRedCard && !alarmPlaying) {
      setAlarmPlaying(true);
      try {
        const ctx = new AudioContext();
        const playBeep = () => {
          if (!hasRedCard) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 600;
          gain.gain.value = 0.2;
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        };
        playBeep();
        const interval = setInterval(playBeep, 30000);
        alarmAudioRef.current = { pause: () => clearInterval(interval) } as unknown as HTMLAudioElement;
      } catch { /* audio not available */ }
    }
    if (!hasRedCard && alarmPlaying && alarmAudioRef.current) {
      alarmAudioRef.current.pause();
      alarmAudioRef.current = null;
      setAlarmPlaying(false);
    }
  }, [hasRedCard, alarmPlaying, soundEnabled]);

  // --- Handlers ---

  const handleStart = useCallback(async (orderId: string, itemIds: string[]) => {
    for (const itemId of itemIds) {
      await fetch(`/api/orders/${orderId}/items/${itemId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });
    }
    refetchOrders();
  }, [refetchOrders]);

  const handleReady = useCallback(async (orderId: string, itemIds: string[]) => {
    for (const itemId of itemIds) {
      await fetch(`/api/orders/${orderId}/items/${itemId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "READY" }),
      });
    }
    refetchOrders();
  }, [refetchOrders]);

  const markMessageRead = async (id: string) => {
    await fetch(`/api/kds/messages/${id}/read`, { method: "PATCH" });
    refetchMessages();
  };

  const cycleFontSize = () => {
    const sizes: FontSize[] = ["sm", "md", "lg", "xl"];
    const idx = sizes.indexOf(fontSize);
    setFontSize(sizes[(idx + 1) % sizes.length]);
  };

  // --- Render ---

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-white">
      {/* === TOP BAR === */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-900 px-3 py-2">
        {/* Station tabs */}
        <div className="flex gap-1">
          {stations.map((s) => (
            <button
              key={s.id}
              onClick={() => setStationId(s.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
                stationId === s.id
                  ? "bg-white text-slate-900"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* View mode toggle */}
        <div className="flex rounded-lg border border-slate-700 p-0.5">
          <button
            onClick={() => setViewMode("tiled")}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              viewMode === "tiled" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
            )}
            title="Kafelki"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("allday")}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              viewMode === "allday" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
            )}
            title="All-Day Count"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("expo")}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              viewMode === "expo" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
            )}
            title="Expo (wydawka)"
          >
            <Monitor className="h-4 w-4" />
          </button>
        </div>

        {/* Font size */}
        <button
          onClick={cycleFontSize}
          className="rounded-lg border border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
          title={`Czcionka: ${fontSize.toUpperCase()}`}
        >
          Aa {fontSize.toUpperCase()}
        </button>

        {/* Sound toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={cn(
            "rounded-lg border border-slate-700 p-1.5 transition-colors",
            soundEnabled ? "text-emerald-400 hover:bg-slate-800" : "text-red-400 hover:bg-slate-800"
          )}
          title={soundEnabled ? "Dźwięki włączone" : "Dźwięki wyłączone"}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>

        {/* Messages */}
        <button
          onClick={() => setMessagesOpen(true)}
          className={cn(
            "relative rounded-lg border border-slate-700 p-1.5 transition-colors hover:bg-slate-800",
            unreadCount > 0 ? "text-amber-400" : "text-slate-400"
          )}
        >
          <MessageSquare className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Stats */}
        <div className="hidden items-center gap-3 text-xs text-slate-500 sm:flex">
          <span>{active.length} aktywnych</span>
          <span>{served.length} wydanych</span>
        </div>
      </div>

      {/* === MAIN CONTENT === */}
      {viewMode === "tiled" && (
        <div className="flex-1 overflow-y-auto p-3">
          {active.length === 0 ? (
            <div className="flex h-full items-center justify-center text-slate-600">
              <div className="text-center">
                <ChefHat className="mx-auto mb-3 h-16 w-16" />
                <p className="text-2xl font-semibold">Brak zamówień</p>
                <p className="mt-1 text-sm">Oczekiwanie na nowe zamówienia...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {active.map((card) => (
                <KDSOrderCard
                  key={card.orderId}
                  card={card}
                  onStart={handleStart}
                  onReady={handleReady}
                  fontSize={fontSize}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {viewMode === "allday" && (
        <AllDayCountView cards={active} fontSize={fontSize} />
      )}

      {viewMode === "expo" && (
        <ExpoView cards={active} fontSize={fontSize} />
      )}

      {/* === BOTTOM BAR: served orders === */}
      {served.length > 0 && viewMode === "tiled" && (
        <div className="border-t border-slate-800 bg-slate-900 px-3 py-2">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
            <UtensilsCrossed className="h-3.5 w-3.5" />
            Ostatnio wydane
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {served.slice(0, 12).map((s) => (
              <div
                key={s.orderId}
                className="shrink-0 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs"
              >
                <span className="font-semibold text-slate-300">
                  {s.tableNumber != null ? `St. ${s.tableNumber}` : `#${s.orderNumber}`}
                </span>
                <span className="ml-1 text-slate-500">
                  {s.items.slice(0, 2).join(", ")}
                  {s.items.length > 2 ? "…" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === MESSAGES DIALOG === */}
      <Dialog open={messagesOpen} onOpenChange={setMessagesOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto border-slate-700 bg-slate-900 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Wiadomości od kelnera</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {messages.length === 0 ? (
              <p className="text-slate-400">Brak nieprzeczytanych wiadomości.</p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className="rounded-lg border border-slate-700 bg-slate-800 p-3"
                >
                  <p className="text-sm text-white">{m.message}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(m.createdAt).toLocaleString("pl-PL")}
                  </p>
                  {!m.readAt && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2 text-slate-300 hover:text-white"
                      onClick={() => markMessageRead(m.id)}
                    >
                      Oznacz jako przeczytane
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
