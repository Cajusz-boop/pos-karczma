"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Truck,
  Package,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Navigation,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface DeliveryOrder {
  id: string;
  orderNumber: number;
  type: "DELIVERY" | "PHONE";
  status: string;
  deliveryStatus: string | null;
  deliveryPhone: string | null;
  deliveryAddress: string | null;
  deliveryNote: string | null;
  estimatedAt: string | null;
  deliveredAt: string | null;
  deliveryCost: number | null;
  createdAt: string;
  zone: { id: string; number: number; name: string } | null;
  driver: { id: string; name: string } | null;
  customer: { id: string; name: string | null; phone: string } | null;
  items: { id: string; productName: string; quantity: number; unitPrice: number }[];
  total: number;
}

interface Driver {
  id: string;
  userId: string;
  userName: string;
  isAvailable: boolean;
  currentOrder: { id: string; orderNumber: number } | null;
}

type StatusFilter = "ALL" | "PENDING" | "PREPARING" | "READY_FOR_PICKUP" | "OUT_FOR_DELIVERY";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Oczekuje",
  PREPARING: "W przygotowaniu",
  READY_FOR_PICKUP: "Gotowe do odbioru",
  OUT_FOR_DELIVERY: "W dostawie",
  DELIVERED: "Dostarczone",
  CANCELLED: "Anulowane",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PREPARING: "bg-blue-100 text-blue-800",
  READY_FOR_PICKUP: "bg-green-100 text-green-800",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function DeliveryPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState("");

  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ["delivery-orders", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }
      const r = await fetch(`/api/orders/delivery?${params}`);
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    refetchInterval: 15000,
  });

  const { data: driversData } = useQuery({
    queryKey: ["available-drivers"],
    queryFn: async () => {
      const r = await fetch("/api/delivery/drivers?available=true");
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    enabled: assignDialog,
  });

  const orders: DeliveryOrder[] = ordersData?.orders ?? [];
  const drivers: Driver[] = driversData?.drivers ?? [];

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, deliveryStatus }: { orderId: string; deliveryStatus: string }) => {
      const r = await fetch("/api/orders/delivery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, deliveryStatus }),
      });
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-orders"] });
    },
  });

  const assignDriverMutation = useMutation({
    mutationFn: async ({ orderId, driverId }: { orderId: string; driverId: string }) => {
      const r = await fetch("/api/delivery/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, driverId }),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error ?? "Błąd");
      }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-orders"] });
      queryClient.invalidateQueries({ queryKey: ["available-drivers"] });
      setAssignDialog(false);
      setSelectedOrder(null);
    },
  });

  const completeDeliveryMutation = useMutation({
    mutationFn: async ({ orderId, driverId, status }: { orderId: string; driverId: string; status: "DELIVERED" | "CANCELLED" }) => {
      const r = await fetch(
        `/api/delivery/assign?orderId=${orderId}&driverId=${driverId}&status=${status}`,
        { method: "DELETE" }
      );
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-orders"] });
      queryClient.invalidateQueries({ queryKey: ["available-drivers"] });
    },
  });

  const openAssignDialog = (order: DeliveryOrder) => {
    setSelectedOrder(order);
    setSelectedDriverId("");
    setAssignDialog(true);
  };

  const getNextStatus = (current: string | null): string | null => {
    switch (current) {
      case "PENDING":
        return "PREPARING";
      case "PREPARING":
        return "READY_FOR_PICKUP";
      case "READY_FOR_PICKUP":
        return "OUT_FOR_DELIVERY";
      default:
        return null;
    }
  };

  const activeOrders = orders.filter(
    (o) => o.deliveryStatus && !["DELIVERED", "CANCELLED"].includes(o.deliveryStatus)
  );
  const completedOrders = orders.filter(
    (o) => o.deliveryStatus && ["DELIVERED", "CANCELLED"].includes(o.deliveryStatus)
  );

  const FILTERS: { id: StatusFilter; label: string }[] = [
    { id: "ALL", label: "Wszystkie" },
    { id: "PENDING", label: "Oczekujące" },
    { id: "PREPARING", label: "W przygotowaniu" },
    { id: "READY_FOR_PICKUP", label: "Gotowe" },
    { id: "OUT_FOR_DELIVERY", label: "W dostawie" },
  ];

  return (
    <div className="container max-w-6xl space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Truck className="h-6 w-6 text-orange-500" />
          <h1 className="text-2xl font-semibold">Panel dostaw</h1>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Odśwież
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.id}
            variant={statusFilter === f.id ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(f.id)}
          >
            {f.label}
            {f.id !== "ALL" && (
              <span className="ml-1 rounded-full bg-white/20 px-1.5 text-xs">
                {orders.filter((o) => o.deliveryStatus === f.id).length}
              </span>
            )}
          </Button>
        ))}
      </div>

      {isLoading && <p className="text-muted-foreground">Ładowanie zamówień...</p>}

      {!isLoading && activeOrders.length === 0 && (
        <div className="rounded-lg border bg-muted/20 p-8 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 font-medium">Brak aktywnych zamówień dostawy</p>
          <p className="text-sm text-muted-foreground">
            Nowe zamówienia pojawią się tutaj automatycznie
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {activeOrders.map((order) => (
          <div
            key={order.id}
            className="rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between border-b p-3">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold">#{order.orderNumber}</span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    STATUS_COLORS[order.deliveryStatus ?? "PENDING"]
                  }`}
                >
                  {STATUS_LABELS[order.deliveryStatus ?? "PENDING"]}
                </span>
                {order.type === "PHONE" && (
                  <span className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                    Telefon
                  </span>
                )}
              </div>
              <div className="text-right text-sm text-muted-foreground">
                {format(new Date(order.createdAt), "HH:mm", { locale: pl })}
              </div>
            </div>

            <div className="space-y-2 p-3">
              {order.deliveryAddress && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="text-sm">{order.deliveryAddress}</span>
                </div>
              )}
              {order.deliveryPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${order.deliveryPhone}`} className="text-sm hover:underline">
                    {order.deliveryPhone}
                  </a>
                </div>
              )}
              {order.zone && (
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Strefa {order.zone.number}: {order.zone.name}
                  </span>
                </div>
              )}
              {order.estimatedAt && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Odbiór: {format(new Date(order.estimatedAt), "HH:mm", { locale: pl })}
                  </span>
                </div>
              )}
              {order.deliveryNote && (
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                  <span className="text-sm text-amber-700">{order.deliveryNote}</span>
                </div>
              )}
            </div>

            <div className="border-t bg-muted/30 p-3">
              <div className="mb-2 flex flex-wrap gap-1 text-xs">
                {order.items.slice(0, 4).map((item, i) => (
                  <span key={i} className="rounded bg-white px-1.5 py-0.5">
                    {item.quantity}× {item.productName}
                  </span>
                ))}
                {order.items.length > 4 && (
                  <span className="text-muted-foreground">+{order.items.length - 4} więcej</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">{order.total.toFixed(2)} zł</span>
                {order.deliveryCost !== null && order.deliveryCost > 0 && (
                  <span className="text-xs text-muted-foreground">
                    (w tym dostawa: {order.deliveryCost.toFixed(2)} zł)
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t p-3">
              {order.driver ? (
                <div className="flex items-center gap-2 rounded bg-blue-50 px-2 py-1 text-sm">
                  <User className="h-4 w-4 text-blue-600" />
                  <span>{order.driver.name}</span>
                  {order.deliveryStatus === "OUT_FOR_DELIVERY" && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        className="ml-2 h-7 bg-green-600 hover:bg-green-700"
                        onClick={() =>
                          completeDeliveryMutation.mutate({
                            orderId: order.id,
                            driverId: order.driver!.id,
                            status: "DELIVERED",
                          })
                        }
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Dostarczone
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7"
                        onClick={() =>
                          completeDeliveryMutation.mutate({
                            orderId: order.id,
                            driverId: order.driver!.id,
                            status: "CANCELLED",
                          })
                        }
                      >
                        <XCircle className="mr-1 h-3 w-3" />
                        Anuluj
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                order.deliveryStatus === "READY_FOR_PICKUP" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openAssignDialog(order)}
                    className="gap-1"
                  >
                    <User className="h-4 w-4" />
                    Przypisz kierowcę
                  </Button>
                )
              )}

              {getNextStatus(order.deliveryStatus) && !order.driver && (
                <Button
                  size="sm"
                  onClick={() =>
                    updateStatusMutation.mutate({
                      orderId: order.id,
                      deliveryStatus: getNextStatus(order.deliveryStatus)!,
                    })
                  }
                  disabled={updateStatusMutation.isPending}
                >
                  → {STATUS_LABELS[getNextStatus(order.deliveryStatus)!]}
                </Button>
              )}

              {order.deliveryStatus === "READY_FOR_PICKUP" && order.driver && (
                <Button
                  size="sm"
                  onClick={() =>
                    updateStatusMutation.mutate({
                      orderId: order.id,
                      deliveryStatus: "OUT_FOR_DELIVERY",
                    })
                  }
                  disabled={updateStatusMutation.isPending}
                >
                  <Truck className="mr-1 h-4 w-4" />
                  Wyślij w trasę
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {completedOrders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-muted-foreground">
            Zakończone dzisiaj ({completedOrders.length})
          </h2>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-left">Nr</th>
                  <th className="p-2 text-left">Adres</th>
                  <th className="p-2 text-left">Kierowca</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-right">Kwota</th>
                  <th className="p-2 text-right">Czas</th>
                </tr>
              </thead>
              <tbody>
                {completedOrders.slice(0, 10).map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="p-2 font-medium">#{order.orderNumber}</td>
                    <td className="p-2 text-muted-foreground">
                      {order.deliveryAddress ?? order.deliveryPhone ?? "—"}
                    </td>
                    <td className="p-2">{order.driver?.name ?? "—"}</td>
                    <td className="p-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          STATUS_COLORS[order.deliveryStatus ?? "DELIVERED"]
                        }`}
                      >
                        {STATUS_LABELS[order.deliveryStatus ?? "DELIVERED"]}
                      </span>
                    </td>
                    <td className="p-2 text-right">{order.total.toFixed(2)} zł</td>
                    <td className="p-2 text-right text-muted-foreground">
                      {order.deliveredAt
                        ? format(new Date(order.deliveredAt), "HH:mm", { locale: pl })
                        : format(new Date(order.createdAt), "HH:mm", { locale: pl })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Przypisz kierowcę do zamówienia #{selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selectedOrder?.deliveryAddress && (
              <p className="text-sm text-muted-foreground">
                <MapPin className="mr-1 inline h-4 w-4" />
                {selectedOrder.deliveryAddress}
              </p>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium">Wybierz kierowcę</label>
              <select
                className="w-full rounded border px-3 py-2"
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
              >
                <option value="">— Wybierz —</option>
                {drivers
                  .filter((d) => d.isAvailable && !d.currentOrder)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.userName}
                    </option>
                  ))}
              </select>
              {drivers.filter((d) => d.isAvailable && !d.currentOrder).length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  Brak dostępnych kierowców. Wszyscy są w trasie lub niedostępni.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(false)}>
              Anuluj
            </Button>
            <Button
              onClick={() =>
                selectedOrder &&
                selectedDriverId &&
                assignDriverMutation.mutate({
                  orderId: selectedOrder.id,
                  driverId: selectedDriverId,
                })
              }
              disabled={assignDriverMutation.isPending || !selectedDriverId}
            >
              {assignDriverMutation.isPending ? "Przypisuję..." : "Przypisz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
