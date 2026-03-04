"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { WeekNavigator } from "@/components/imprezy/WeekNavigator";
import { Button } from "@/components/ui/button";
import { RefreshCw, Printer, AlertTriangle } from "lucide-react";
import { useRef } from "react";

interface ProcurementItem {
  productId: number;
  productName: string;
  totalQuantity: number;
  unit: string;
  stockMinimum: number | null;
  deficit: number;
}

interface CalculatorTabProps {
  weekStart: Date;
  weekEnd: Date;
  onWeekChange: (d: Date) => void;
}

async function fetchCalculation(weekStart: Date, weekEnd: Date) {
  const sp = new URLSearchParams({
    weekStart: format(weekStart, "yyyy-MM-dd"),
    weekEnd: format(weekEnd, "yyyy-MM-dd"),
  });
  const res = await fetch(`/api/procurement/calculate?${sp}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Błąd pobierania kalkulacji");
  }
  return res.json();
}

export function CalculatorTab({
  weekStart,
  weekEnd,
  onWeekChange,
}: CalculatorTabProps) {
  const tableRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["procurement-calculate", format(weekStart, "yyyy-MM-dd"), format(weekEnd, "yyyy-MM-dd")],
    queryFn: () => fetchCalculation(weekStart, weekEnd),
  });

  const handlePrint = () => {
    const el = tableRef.current;
    if (!el) return;
    const printContent = el.innerHTML;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Zapotrzebowanie ${format(weekStart, "dd.MM.yyyy", { locale: pl })} - ${format(weekEnd, "dd.MM.yyyy", { locale: pl })}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 2rem; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
            th { background: #f5f5f5; }
            .deficit { background: #fee2e2; color: #991b1b; }
            h1 { margin-bottom: 1rem; }
          </style>
        </head>
        <body>
          <h1>Kalkulator zapotrzebowania</h1>
          <p>Tydzień: ${format(weekStart, "dd.MM.yyyy", { locale: pl })} – ${format(weekEnd, "dd.MM.yyyy", { locale: pl })}</p>
          ${printContent}
        </body>
      </html>
    `);
    win.document.close();
    win.print();
    win.close();
  };

  const items: ProcurementItem[] = data?.items ?? [];
  const events = data?.events ?? [];
  const hotelSystemConfigured = data?.hotelSystemConfigured ?? true;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <WeekNavigator weekStart={weekStart} onWeekChange={onWeekChange} />
        <Button
          variant="outline"
          size="lg"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-5 w-5 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Odśwież
        </Button>
        {items.length > 0 && (
          <Button variant="outline" size="lg" onClick={handlePrint}>
            <Printer className="h-5 w-5 mr-2" />
            Drukuj
          </Button>
        )}
      </div>

      {!hotelSystemConfigured && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>
            HotelSystem nie jest skonfigurowany (HOTEL_SYSTEM_URL). Imprezy nie
            będą pobierane.
          </p>
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>{error instanceof Error ? error.message : "Błąd pobierania danych"}</p>
        </div>
      )}

      {events.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">
            Imprezy w wybranym tygodniu ({events.length})
          </h2>
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left">Data</th>
                  <th className="px-4 py-2 text-left">Nazwa</th>
                  <th className="px-4 py-2 text-left">Typ</th>
                  <th className="px-4 py-2 text-right">Goście</th>
                  <th className="px-4 py-2 text-left">Pakiet ID</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e: { id: string; name: string; eventType: string; dateFrom: string; guestCount: number; packageId: number | null }) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="px-4 py-2">
                      {e.dateFrom
                        ? format(new Date(e.dateFrom), "dd.MM.yyyy", {
                            locale: pl,
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-2 font-medium">{e.name || "—"}</td>
                    <td className="px-4 py-2">{e.eventType || "—"}</td>
                    <td className="px-4 py-2 text-right">{e.guestCount}</td>
                    <td className="px-4 py-2">{e.packageId ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {events.length === 0 && !isLoading && !isError && hotelSystemConfigured && (
        <p className="text-muted-foreground">
          Brak imprez potwierdzonych z pakietem w wybranym tygodniu.
        </p>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-2">Lista zakupów</h2>
        {isLoading ? (
          <div className="h-32 rounded-xl border bg-muted/30 animate-pulse" />
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center text-muted-foreground">
            Brak składników do wyświetlenia. Wybierz tydzień z imprezami lub
            sprawdź konfigurację HotelSystem.
          </div>
        ) : (
          <div ref={tableRef} className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left">Składnik</th>
                  <th className="px-4 py-2 text-right">Potrzebna ilość</th>
                  <th className="px-4 py-2 text-left">Jednostka</th>
                  <th className="px-4 py-2 text-right">Minimum magazynowe</th>
                  <th className="px-4 py-2 text-right">Niedobór</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr
                    key={row.productId}
                    className={`border-b last:border-0 ${
                      row.deficit > 0 ? "bg-red-50 text-red-900" : ""
                    }`}
                  >
                    <td className="px-4 py-2 font-medium">{row.productName}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {row.totalQuantity.toFixed(3)}
                    </td>
                    <td className="px-4 py-2">{row.unit}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {row.stockMinimum != null
                        ? row.stockMinimum.toFixed(3)
                        : "—"}
                    </td>
                    <td
                      className={`px-4 py-2 text-right tabular-nums font-medium ${
                        row.deficit > 0 ? "text-red-600" : ""
                      }`}
                    >
                      {row.deficit > 0 ? row.deficit.toFixed(3) : "0"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
