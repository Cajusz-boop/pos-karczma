"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Coins,
  RefreshCw,
  ArrowLeft,
  Settings,
  Users,
  ChefHat,
  Wine,
  Save,
} from "lucide-react";
import Link from "next/link";

interface WaiterTipReport {
  userId: string;
  name: string;
  grossTips: number;
  poolContribution: number;
  netTips: number;
  count: number;
}

interface TipConfig {
  poolEnabled: boolean;
  poolPercentage: number;
  kitchenShare: number;
  barShare: number;
}

interface TipReport {
  config: TipConfig;
  period: { from: string; to: string };
  grandTotal: number;
  totalTips: number;
  pool: { enabled: boolean; amount: number; kitchenShare: number; barShare: number };
  waiters: WaiterTipReport[];
}

export default function TipsReportPage() {
  const [report, setReport] = useState<TipReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [configOpen, setConfigOpen] = useState(false);

  // Config editing
  const [poolEnabled, setPoolEnabled] = useState(false);
  const [poolPercentage, setPoolPercentage] = useState("30");
  const [kitchenShare, setKitchenShare] = useState("20");
  const [barShare, setBarShare] = useState("10");
  const [saving, setSaving] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tips?from=${dateFrom}&to=${dateTo}`);
      const data = await res.json();
      setReport(data);
      if (data.config) {
        setPoolEnabled(data.config.poolEnabled);
        setPoolPercentage(String(data.config.poolPercentage));
        setKitchenShare(String(data.config.kitchenShare));
        setBarShare(String(data.config.barShare));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const saveConfig = async () => {
    setSaving(true);
    try {
      await fetch("/api/tips", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poolEnabled,
          poolPercentage: parseFloat(poolPercentage) || 0,
          kitchenShare: parseFloat(kitchenShare) || 0,
          barShare: parseFloat(barShare) || 0,
        }),
      });
      fetchReport();
      setConfigOpen(false);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/reports">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Coins className="h-7 w-7 text-yellow-500" />
          <div>
            <h1 className="text-2xl font-bold">Raport napiwków</h1>
            <p className="text-sm text-muted-foreground">
              Podział per kelner{report?.pool.enabled ? " z poolingiem" : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setConfigOpen(!configOpen)}>
            <Settings className="mr-1.5 h-4 w-4" />
            Konfiguracja
          </Button>
          <Button variant="outline" size="sm" onClick={fetchReport} disabled={loading}>
            <RefreshCw className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")} />
            Odśwież
          </Button>
        </div>
      </div>

      {/* Date range */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground">Od:</label>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
        <label className="text-sm text-muted-foreground">Do:</label>
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
      </div>

      {/* Config panel */}
      {configOpen && (
        <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-semibold">Konfiguracja poolingu napiwków</p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={poolEnabled}
              onChange={(e) => setPoolEnabled(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            <span className="font-medium">Włącz pooling (pula wspólna)</span>
          </label>
          {poolEnabled && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium">% do puli</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={poolPercentage}
                  onChange={(e) => setPoolPercentage(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">% puli → kuchnia</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={kitchenShare}
                  onChange={(e) => setKitchenShare(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">% puli → bar</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={barShare}
                  onChange={(e) => setBarShare(e.target.value)}
                />
              </div>
            </div>
          )}
          <Button size="sm" onClick={saveConfig} disabled={saving} className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            {saving ? "Zapisywanie…" : "Zapisz"}
          </Button>
        </div>
      )}

      {/* Summary cards */}
      {report && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border p-4 text-center">
            <p className="text-xs text-muted-foreground">Łącznie napiwków</p>
            <p className="text-2xl font-black tabular-nums text-yellow-600">{report.grandTotal.toFixed(2)} zł</p>
            <p className="text-xs text-muted-foreground">{report.totalTips} transakcji</p>
          </div>
          {report.pool.enabled && (
            <>
              <div className="rounded-xl border p-4 text-center">
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Users className="h-3 w-3" /> Pula wspólna
                </p>
                <p className="text-2xl font-black tabular-nums">{report.pool.amount.toFixed(2)} zł</p>
              </div>
              <div className="rounded-xl border p-4 text-center">
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <ChefHat className="h-3 w-3" /> Kuchnia
                </p>
                <p className="text-2xl font-black tabular-nums">{report.pool.kitchenShare.toFixed(2)} zł</p>
              </div>
              <div className="rounded-xl border p-4 text-center">
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Wine className="h-3 w-3" /> Bar
                </p>
                <p className="text-2xl font-black tabular-nums">{report.pool.barShare.toFixed(2)} zł</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Per-waiter report */}
      {report && report.waiters.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Per kelner</h2>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Kelner</th>
                  <th className="px-4 py-2 text-right font-medium">Brutto</th>
                  {report.pool.enabled && (
                    <th className="px-4 py-2 text-right font-medium">Do puli</th>
                  )}
                  <th className="px-4 py-2 text-right font-medium">Netto</th>
                  <th className="px-4 py-2 text-right font-medium">Ilość</th>
                </tr>
              </thead>
              <tbody>
                {report.waiters.map((w) => (
                  <tr key={w.userId} className="border-t">
                    <td className="px-4 py-2 font-medium">{w.name}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{w.grossTips.toFixed(2)} zł</td>
                    {report.pool.enabled && (
                      <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                        -{w.poolContribution.toFixed(2)} zł
                      </td>
                    )}
                    <td className="px-4 py-2 text-right tabular-nums font-bold">{w.netTips.toFixed(2)} zł</td>
                    <td className="px-4 py-2 text-right tabular-nums">{w.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {report && report.waiters.length === 0 && !loading && (
        <div className="py-12 text-center">
          <Coins className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">Brak napiwków w wybranym okresie</p>
        </div>
      )}
    </div>
  );
}
