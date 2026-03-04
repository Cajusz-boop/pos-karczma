"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  TrendingDown,
  TrendingUp,
  RefreshCw,
  ArrowLeft,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import Link from "next/link";

interface FoodCostItem {
  productId: string;
  productName: string;
  categoryName: string;
  priceGross: number;
  costPrice: number;
  margin: number;
  marginPercent: number;
  foodCostPercent: number;
  qtySold: number;
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
  alert: boolean;
}

interface FoodCostReport {
  period: { from: string; to: string };
  threshold: number;
  summary: {
    totalRevenue: number;
    totalCost: number;
    totalMargin: number;
    overallFoodCostPercent: number;
    productCount: number;
    alertCount: number;
    productsWithCost: number;
    productsWithoutCost: number;
  };
  items: FoodCostItem[];
}

export default function FoodCostPage() {
  const [report, setReport] = useState<FoodCostReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [threshold, setThreshold] = useState("35");
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/food-cost?from=${dateFrom}&to=${dateTo}&threshold=${threshold}`);
      const data = await res.json();
      setReport(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, threshold]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const filteredItems = report?.items.filter((i) =>
    showOnlyAlerts ? i.alert : true
  ) ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/reports">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <DollarSign className="h-7 w-7 text-emerald-500" />
          <div>
            <h1 className="text-2xl font-bold">Food Cost i Marża</h1>
            <p className="text-sm text-muted-foreground">
              Koszt składników per danie, analiza rentowności
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchReport} disabled={loading}>
          <RefreshCw className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")} />
          Odśwież
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Od:</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Do:</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Próg alertu (%):</label>
          <Input type="number" min="0" max="100" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="w-20" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showOnlyAlerts} onChange={(e) => setShowOnlyAlerts(e.target.checked)} className="h-4 w-4 rounded" />
          Tylko alerty
        </label>
      </div>

      {/* Summary cards */}
      {report && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border p-4 text-center">
            <p className="text-xs text-muted-foreground">Przychód</p>
            <p className="text-2xl font-black tabular-nums text-emerald-600">{report.summary.totalRevenue.toFixed(0)} zł</p>
          </div>
          <div className="rounded-xl border p-4 text-center">
            <p className="text-xs text-muted-foreground">Koszt składników</p>
            <p className="text-2xl font-black tabular-nums text-red-600">{report.summary.totalCost.toFixed(0)} zł</p>
          </div>
          <div className="rounded-xl border p-4 text-center">
            <p className="text-xs text-muted-foreground">Marża</p>
            <p className="text-2xl font-black tabular-nums">{report.summary.totalMargin.toFixed(0)} zł</p>
          </div>
          <div className={cn(
            "rounded-xl border p-4 text-center",
            report.summary.overallFoodCostPercent > parseFloat(threshold) && "border-red-300 bg-red-50 dark:bg-red-950/20"
          )}>
            <p className="text-xs text-muted-foreground">Food Cost %</p>
            <p className={cn(
              "text-2xl font-black tabular-nums",
              report.summary.overallFoodCostPercent > parseFloat(threshold) ? "text-red-600" : "text-emerald-600"
            )}>
              {report.summary.overallFoodCostPercent}%
            </p>
          </div>
        </div>
      )}

      {/* Alerts summary */}
      {report && report.summary.alertCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:bg-amber-950/20">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm">
            <span className="font-bold text-amber-700">{report.summary.alertCount} produktów</span>{" "}
            ma food cost powyżej {threshold}%
          </p>
        </div>
      )}

      {report && report.summary.productsWithoutCost > 0 && (
        <p className="text-xs text-muted-foreground">
          ℹ️ {report.summary.productsWithoutCost} produktów nie ma ustawionego kosztu składników
        </p>
      )}

      {/* Table */}
      {filteredItems.length > 0 && (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Produkt</th>
                <th className="px-3 py-2 text-left font-medium">Kategoria</th>
                <th className="px-3 py-2 text-right font-medium">Cena</th>
                <th className="px-3 py-2 text-right font-medium">Koszt</th>
                <th className="px-3 py-2 text-right font-medium">Marża</th>
                <th className="px-3 py-2 text-right font-medium">FC %</th>
                <th className="px-3 py-2 text-right font-medium">Sprzedano</th>
                <th className="px-3 py-2 text-right font-medium">Przychód</th>
                <th className="px-3 py-2 text-right font-medium">Zysk</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr
                  key={item.productId}
                  className={cn(
                    "border-t",
                    item.alert && "bg-red-50/50 dark:bg-red-950/10"
                  )}
                >
                  <td className="px-3 py-2 font-medium">
                    {item.alert && <AlertTriangle className="mr-1 inline h-3.5 w-3.5 text-red-500" />}
                    {item.productName}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{item.categoryName}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{item.priceGross.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {item.costPrice > 0 ? item.costPrice.toFixed(2) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {item.costPrice > 0 ? item.margin.toFixed(2) : "—"}
                  </td>
                  <td className={cn(
                    "px-3 py-2 text-right tabular-nums font-bold",
                    item.alert ? "text-red-600" : item.foodCostPercent > 0 ? "text-emerald-600" : "text-muted-foreground"
                  )}>
                    {item.costPrice > 0 ? (
                      <span className="flex items-center justify-end gap-1">
                        {item.foodCostPercent > parseFloat(threshold) ? (
                          <TrendingDown className="h-3.5 w-3.5" />
                        ) : (
                          <TrendingUp className="h-3.5 w-3.5" />
                        )}
                        {item.foodCostPercent}%
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{item.qtySold}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{item.totalRevenue.toFixed(0)}</td>
                  <td className={cn(
                    "px-3 py-2 text-right tabular-nums font-bold",
                    item.totalMargin < 0 ? "text-red-600" : ""
                  )}>
                    {item.totalMargin.toFixed(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
