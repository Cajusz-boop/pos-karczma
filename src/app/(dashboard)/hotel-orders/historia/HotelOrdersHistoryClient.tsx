"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Hotel,
  ChevronDown,
  ChevronRight,
  Loader2,
  History,
  Receipt,
  User,
} from "lucide-react";

interface HotelOrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  note: string | null;
}

interface HotelOrder {
  orderId: string;
  orderNumber: number;
  roomNumber: string;
  amount: number;
  createdAt: string;
  waiterName: string;
  items: HotelOrderItem[];
}

interface OrdersResponse {
  orders: HotelOrder[];
}

function formatDateTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function getDatePresets() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return {
    today: { label: "Dziś", from: fmt(today), to: fmt(today) },
    yesterday: {
      label: "Wczoraj",
      from: fmt(yesterday),
      to: fmt(yesterday),
    },
    last7: {
      label: "Ostatnie 7 dni",
      from: fmt(weekAgo),
      to: fmt(today),
    },
    all: { label: "Wszystkie", from: "", to: "" },
  };
}

export function HotelOrdersHistoryClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoom = searchParams.get("roomNumber") ?? "";
  const [roomFilter, setRoomFilter] = useState(initialRoom);
  const [datePreset, setDatePreset] = useState<keyof ReturnType<typeof getDatePresets>>("today");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [time, setTime] = useState("");

  const presets = getDatePresets();
  const activePreset = presets[datePreset];

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

  const { data, isLoading, error } = useQuery<OrdersResponse>({
    queryKey: ["hotel-orders-history", roomFilter, activePreset.from, activePreset.to],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (roomFilter.trim()) params.set("roomNumber", roomFilter.trim());
      if (activePreset.from) params.set("dateFrom", activePreset.from);
      if (activePreset.to) params.set("dateTo", activePreset.to);
      const res = await fetch(`/api/hotel/orders?${params}`);
      if (!res.ok) throw new Error("Błąd pobierania historii");
      return res.json();
    },
    staleTime: 30_000,
  });

  const orders = data?.orders ?? [];

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <header className="flex items-center gap-3 border-b bg-card px-3 py-2 sm:px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/hotel-orders")}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="relative h-8 w-10 shrink-0">
          <Image
            src="/logo.png"
            alt="Łabędź"
            fill
            className="object-contain object-left"
            unoptimized
          />
        </div>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold sm:text-base">
            Historia zamówień na pokoje
          </span>
        </div>
        <span className="flex-1" />
        <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
          {time}
        </span>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-3 py-2">
          <div className="flex gap-1 rounded-lg bg-background p-0.5">
            {(Object.keys(presets) as Array<keyof typeof presets>).map((key) => (
              <Button
                key={key}
                variant={datePreset === key ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => setDatePreset(key)}
              >
                {presets[key].label}
              </Button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Numer pokoju…"
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="h-8 w-24 rounded-md border bg-background px-2 text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Ładowanie historii…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <p className="text-destructive">Błąd pobierania danych</p>
              <Button variant="outline" onClick={() => router.refresh()}>
                Odśwież
              </Button>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground" />
              <p className="font-medium">Brak zamówień</p>
              <p className="text-sm text-muted-foreground">
                {roomFilter || datePreset !== "all"
                  ? "Zmień filtry, by zobaczyć inne wyniki."
                  : "Jeszcze nie było zamówień na pokoje w tym okresie."}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {orders.map((order) => {
                const isExpanded = expandedId === order.orderId;
                return (
                  <li
                    key={order.orderId}
                    className={cn(
                      "rounded-lg border bg-card transition-colors",
                      isExpanded && "ring-2 ring-primary/20"
                    )}
                  >
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 p-3 text-left"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : order.orderId)
                      }
                    >
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform",
                          isExpanded && "rotate-90"
                        )}
                      />
                      <span className="font-mono text-lg font-bold tabular-nums">
                        Pokój {order.roomNumber}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm">zam. #{order.orderNumber}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm font-medium tabular-nums">
                        {order.amount.toFixed(2)} zł
                      </span>
                      <span className="flex-1" />
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(order.createdAt)}
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="border-t px-3 py-3 pl-9">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-3.5 w-3.5" />
                          Kelner: {order.waiterName}
                        </div>
                        <ul className="mt-2 space-y-1">
                          {order.items.map((item, idx) => (
                            <li
                              key={idx}
                              className="flex items-baseline justify-between gap-4 text-sm"
                            >
                              <span>
                                {item.quantity}× {item.productName}
                                {item.note && (
                                  <span className="text-muted-foreground">
                                    {" "}
                                    ({item.note})
                                  </span>
                                )}
                              </span>
                              <span className="tabular-nums">
                                {(item.quantity * item.unitPrice).toFixed(2)} zł
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t bg-card px-4 py-3">
        <Button
          variant="outline"
          onClick={() => router.push("/hotel-orders")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Powrót do pokoi
        </Button>
      </div>
    </div>
  );
}
