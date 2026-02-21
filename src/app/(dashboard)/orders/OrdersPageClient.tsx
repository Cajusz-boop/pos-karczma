"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Otwarte",
  SENT_TO_KITCHEN: "Wysłane do kuchni",
  IN_PROGRESS: "W realizacji",
  READY: "Gotowe",
  SERVED: "Podane",
  BILL_REQUESTED: "Prośba o rachunek",
  CLOSED: "Zamknięte",
  CANCELLED: "Anulowane",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  SENT_TO_KITCHEN: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  IN_PROGRESS: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  READY: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  SERVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  BILL_REQUESTED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  CLOSED: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

type OrderRow = {
  id: string;
  orderNumber: number;
  tableNumber: number | null;
  tableName: string;
  waiterName: string;
  status: string;
  total: number;
  createdAt: string;
  closedAt: string | null;
};

export default function OrdersPageClient() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: orders = [], isLoading } = useQuery<OrderRow[]>({
    queryKey: ["orders-history", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", "50");
      if (statusFilter === "open")
        params.set("status", "open");
      else if (statusFilter === "closed")
        params.set("status", "closed");
      else if (statusFilter === "cancelled")
        params.set("status", "cancelled");
      const r = await fetch(`/api/orders?${params}`);
      if (!r.ok) throw new Error("Błąd pobierania zamówień");
      return r.json();
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <ShoppingCart className="h-6 w-6" />
          Historia zamówień
        </h1>
      </div>

      <div className="flex flex-wrap gap-2 rounded-lg border p-4">
        <span className="text-sm font-medium">Status:</span>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === "" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("")}
          >
            Wszystkie
          </Button>
          <Button
            variant={statusFilter === "open" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("open")}
          >
            Otwarte
          </Button>
          <Button
            variant={statusFilter === "closed" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("closed")}
          >
            Zamknięte
          </Button>
          <Button
            variant={statusFilter === "cancelled" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("cancelled")}
          >
            Anulowane
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Ładowanie…</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-2 text-left">Nr</th>
                <th className="p-2 text-left">Stolik</th>
                <th className="p-2 text-left">Kelner</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-right">Suma</th>
                <th className="p-2 text-left">Data</th>
                <th className="p-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="cursor-pointer border-b transition-colors hover:bg-muted/30"
                  onClick={() => router.push(`/pos/order/${o.id}`)}
                >
                  <td className="p-2 font-medium tabular-nums">
                    #{o.orderNumber}
                  </td>
                  <td className="p-2">{o.tableName}</td>
                  <td className="p-2">{o.waiterName}</td>
                  <td className="p-2">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        STATUS_COLORS[o.status] ??
                          "bg-muted text-muted-foreground"
                      )}
                    >
                      {STATUS_LABELS[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="p-2 text-right tabular-nums font-medium">
                    {o.total.toFixed(2)} zł
                  </td>
                  <td className="p-2 text-muted-foreground">
                    {format(new Date(o.createdAt), "dd.MM.yyyy HH:mm", {
                      locale: pl,
                    })}
                  </td>
                  <td className="p-2">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
            <p className="p-4 text-center text-muted-foreground">
              Brak zamówień w wybranym filtrze.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
