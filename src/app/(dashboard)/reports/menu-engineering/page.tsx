"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  RefreshCw,
  ArrowLeft,
  Star,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";

type BCGCategory = "STAR" | "PLOWHORSE" | "PUZZLE" | "DOG";

interface MenuItem {
  productId: string;
  productName: string;
  categoryName: string;
  priceGross: number;
  costPrice: number;
  margin: number;
  marginPercent: number;
  qtySold: number;
  totalRevenue: number;
  totalMargin: number;
  popularityIndex: number;
  marginIndex: number;
  bcgCategory: BCGCategory;
  recommendation: string;
}

interface MenuReport {
  period: { from: string; to: string };
  averages: { avgQtySold: number; avgMargin: number };
  counts: { stars: number; plowhorses: number; puzzles: number; dogs: number };
  labels: Record<string, string>;
  items: MenuItem[];
}

const BCG_COLORS: Record<BCGCategory, string> = {
  STAR: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400",
  PLOWHORSE: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400",
  PUZZLE: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400",
  DOG: "bg-stone-100 text-stone-600 border-stone-300 dark:bg-stone-800 dark:text-stone-400",
};

const BCG_LABELS: Record<BCGCategory, string> = {
  STAR: "⭐ Gwiazda",
  PLOWHORSE: "🐴 Koń",
  PUZZLE: "🧩 Zagadka",
  DOG: "🐕 Pies",
};

export default function MenuEngineeringPage() {
  const [report, setReport] = useState<MenuReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [filterBcg, setFilterBcg] = useState<BCGCategory | "ALL">("ALL");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/menu-engineering?from=${dateFrom}&to=${dateTo}`);
      const data = await res.json();
      setReport(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const filteredItems = report?.items.filter((i) =>
    filterBcg === "ALL" ? true : i.bcgCategory === filterBcg
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
          <Star className="h-7 w-7 text-yellow-500" />
          <div>
            <h1 className="text-2xl font-bold">Menu Engineering</h1>
            <p className="text-sm text-muted-foreground">
              Macierz BCG — popularność vs marża
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
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
        <span className="text-muted-foreground">—</span>
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
      </div>

      {/* BCG summary cards */}
      {report && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["STAR", "PLOWHORSE", "PUZZLE", "DOG"] as BCGCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterBcg(filterBcg === cat ? "ALL" : cat)}
              className={cn(
                "rounded-xl border-2 p-4 text-center transition-all",
                BCG_COLORS[cat],
                filterBcg === cat && "ring-2 ring-offset-2 ring-current"
              )}
            >
              <p className="text-2xl font-black">{report.counts[cat === "STAR" ? "stars" : cat === "PLOWHORSE" ? "plowhorses" : cat === "PUZZLE" ? "puzzles" : "dogs"]}</p>
              <p className="text-sm font-medium">{BCG_LABELS[cat]}</p>
            </button>
          ))}
        </div>
      )}

      {/* Averages info */}
      {report && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Średnia sprzedaż: <strong>{report.averages.avgQtySold} szt.</strong></span>
          <span>Średnia marża: <strong>{report.averages.avgMargin.toFixed(2)} zł</strong></span>
          {filterBcg !== "ALL" && (
            <Button variant="ghost" size="sm" onClick={() => setFilterBcg("ALL")}>
              Pokaż wszystkie
            </Button>
          )}
        </div>
      )}

      {/* Items table */}
      {filteredItems.length > 0 && (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Danie</th>
                <th className="px-3 py-2 text-left font-medium">Kategoria</th>
                <th className="px-3 py-2 text-center font-medium">BCG</th>
                <th className="px-3 py-2 text-right font-medium">Cena</th>
                <th className="px-3 py-2 text-right font-medium">Marża</th>
                <th className="px-3 py-2 text-right font-medium">Sprzedaż</th>
                <th className="px-3 py-2 text-right font-medium">Zysk łączny</th>
                <th className="px-3 py-2 text-left font-medium">Rekomendacja</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.productId} className="border-t">
                  <td className="px-3 py-2 font-medium">{item.productName}</td>
                  <td className="px-3 py-2 text-muted-foreground">{item.categoryName}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={cn(
                      "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                      BCG_COLORS[item.bcgCategory]
                    )}>
                      {BCG_LABELS[item.bcgCategory]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{item.priceGross.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    <span className="flex items-center justify-end gap-1">
                      {item.marginIndex >= 1 ? (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                      )}
                      {item.margin.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    <span className="flex items-center justify-end gap-1">
                      {item.popularityIndex >= 0.7 ? (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                      )}
                      {item.qtySold}
                    </span>
                  </td>
                  <td className={cn(
                    "px-3 py-2 text-right tabular-nums font-bold",
                    item.totalMargin < 0 ? "text-red-600" : ""
                  )}>
                    {item.totalMargin.toFixed(0)} zł
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground max-w-[200px]">
                    {item.recommendation}
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
