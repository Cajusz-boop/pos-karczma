"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Phone,
  Truck,
  Plus,
  RefreshCw,
  ArrowLeft,
  Clock,
  MapPin,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface DeliveryOrder {
  id: string;
  orderNumber: number;
  type: "PHONE" | "DELIVERY";
  status: string;
  deliveryStatus: string | null;
  deliveryPhone: string | null;
  deliveryAddress: string | null;
  deliveryNote: string | null;
  estimatedAt: string | null;
  createdAt: string;
  user: { id: string; name: string };
  customer: { id: string; name: string | null; phone: string } | null;
  items: { id: string; productName: string; quantity: number; unitPrice: number }[];
  total: number;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Oczekuje",
  PREPARING: "W przygotowaniu",
  READY_FOR_PICKUP: "Gotowe do odbioru",
  OUT_FOR_DELIVERY: "W dostawie",
  DELIVERED: "Dostarczone",
  CANCELLED: "Anulowane",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  PREPARING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  READY_FOR_PICKUP: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  OUT_FOR_DELIVERY: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  DELIVERED: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const NEXT_STATUS: Record<string, string> = {
  PENDING: "PREPARING",
  PREPARING: "READY_FOR_PICKUP",
  READY_FOR_PICKUP: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
};

export default function DeliveryPage() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  // Create form
  const [newType, setNewType] = useState<"PHONE" | "DELIVERY">("PHONE");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newMinutes, setNewMinutes] = useState("30");
  const [creating, setCreating] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders/delivery");
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30_000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleCreate = async () => {
    if (!newPhone.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/orders/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newType,
          deliveryPhone: newPhone.trim(),
          deliveryAddress: newAddress.trim() || undefined,
          deliveryNote: newNote.trim() || undefined,
          estimatedMinutes: parseInt(newMinutes) || 30,
        }),
      });
      if (res.ok) {
        setCreateOpen(false);
        setNewPhone("");
        setNewAddress("");
        setNewNote("");
        fetchOrders();
      }
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  const advanceStatus = async (orderId: string, currentStatus: string) => {
    const nextStatus = NEXT_STATUS[currentStatus];
    if (!nextStatus) return;
    try {
      await fetch("/api/orders/delivery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, deliveryStatus: nextStatus }),
      });
      fetchOrders();
    } catch {
      // ignore
    }
  };

  const activeOrders = orders.filter((o) => o.deliveryStatus !== "DELIVERED" && o.deliveryStatus !== "CANCELLED");
  const completedOrders = orders.filter((o) => o.deliveryStatus === "DELIVERED" || o.deliveryStatus === "CANCELLED");

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/pos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Truck className="h-7 w-7 text-purple-500" />
          <div>
            <h1 className="text-2xl font-bold">Zamówienia telefoniczne i dostawy</h1>
            <p className="text-sm text-muted-foreground">
              {activeOrders.length} aktywnych
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
            <RefreshCw className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nowe zamówienie
          </Button>
        </div>
      </div>

      {/* Active orders */}
      {activeOrders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Aktywne</h2>
          {activeOrders.map((order) => (
            <div key={order.id} className="rounded-xl border p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {order.type === "DELIVERY" ? (
                      <Truck className="h-5 w-5 text-purple-500" />
                    ) : (
                      <Phone className="h-5 w-5 text-blue-500" />
                    )}
                    <span className="text-lg font-bold">#{order.orderNumber}</span>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      STATUS_COLORS[order.deliveryStatus ?? "PENDING"]
                    )}>
                      {STATUS_LABELS[order.deliveryStatus ?? "PENDING"]}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {order.deliveryPhone}
                    </span>
                    {order.deliveryAddress && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {order.deliveryAddress}
                      </span>
                    )}
                    {order.estimatedAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(order.estimatedAt).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold tabular-nums">{order.total.toFixed(2)} zł</p>
                  <p className="text-xs text-muted-foreground">{order.items.length} poz.</p>
                </div>
              </div>

              {order.deliveryNote && (
                <p className="text-sm text-muted-foreground italic">📝 {order.deliveryNote}</p>
              )}

              <div className="flex flex-wrap gap-1">
                {order.items.map((item) => (
                  <span key={item.id} className="rounded bg-muted px-2 py-0.5 text-xs">
                    {item.quantity}× {item.productName}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                  {" • "}{order.user.name}
                </p>
                {NEXT_STATUS[order.deliveryStatus ?? "PENDING"] && (
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={() => advanceStatus(order.id, order.deliveryStatus ?? "PENDING")}
                  >
                    {STATUS_LABELS[NEXT_STATUS[order.deliveryStatus ?? "PENDING"]]}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed orders */}
      {completedOrders.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
            Zakończone ({completedOrders.length})
          </summary>
          <div className="mt-2 space-y-2">
            {completedOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-lg border p-3 opacity-60">
                <div className="flex items-center gap-2">
                  {order.type === "DELIVERY" ? <Truck className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                  <span className="font-bold">#{order.orderNumber}</span>
                  <span className="text-sm text-muted-foreground">{order.deliveryPhone}</span>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    STATUS_COLORS[order.deliveryStatus ?? "DELIVERED"]
                  )}>
                    {STATUS_LABELS[order.deliveryStatus ?? "DELIVERED"]}
                  </span>
                </div>
                <span className="font-bold tabular-nums">{order.total.toFixed(2)} zł</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {!loading && orders.length === 0 && (
        <div className="py-12 text-center">
          <Truck className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">Brak zamówień telefonicznych/dostaw</p>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nowe zamówienie</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                variant={newType === "PHONE" ? "default" : "outline"}
                className="flex-1 gap-1.5"
                onClick={() => setNewType("PHONE")}
              >
                <Phone className="h-4 w-4" />
                Telefoniczne
              </Button>
              <Button
                variant={newType === "DELIVERY" ? "default" : "outline"}
                className="flex-1 gap-1.5"
                onClick={() => setNewType("DELIVERY")}
              >
                <Truck className="h-4 w-4" />
                Dostawa
              </Button>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Numer telefonu *</label>
              <Input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="np. 500 600 700"
                autoFocus
              />
            </div>
            {newType === "DELIVERY" && (
              <div>
                <label className="mb-1 block text-sm font-medium">Adres dostawy</label>
                <Input
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="ul. Przykładowa 1/2"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Szacowany czas (min)
              </label>
              <Input
                type="number"
                min="5"
                max="240"
                value={newMinutes}
                onChange={(e) => setNewMinutes(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Uwagi</label>
              <Input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="np. dzwonek nie działa, proszę zadzwonić"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Anuluj</Button>
            <Button onClick={handleCreate} disabled={creating || !newPhone.trim()}>
              {creating ? "Tworzenie…" : "Utwórz zamówienie"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
