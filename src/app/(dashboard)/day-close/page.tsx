"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
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
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Banknote,
  Receipt,
  Users,
  TrendingUp,
  Loader2,
  ArrowDownToLine,
  ArrowUpFromLine,
  DoorOpen,
  CalendarCheck,
} from "lucide-react";

interface ShiftSummary {
  id: string;
  userId: string;
  userName: string;
  startedAt: string;
  cashStart: number;
  cashTurnover: number;
  totalTurnover: number;
  expectedCash: number;
}

interface DayClosePreview {
  date: string;
  openShifts: ShiftSummary[];
  openOrdersCount: number;
  closedOrdersCount: number;
  cancelledOrdersCount: number;
  totalGross: number;
  paymentBreakdown: Record<string, number>;
  canClose: boolean;
}

interface DayCloseResult {
  ok: boolean;
  date: string;
  closedShifts: Array<{ id: string; userName: string; cashEnd: number }>;
  fiscalReportPrinted: boolean;
  fiscalError?: string;
  report: {
    totalGross: number;
    totalNet: number;
    orderCount: number;
    guestCount: number;
    receiptCount: number;
    invoiceCount: number;
    cancelCount: number;
    cancelAmount: number;
    avgTicket: number;
    paymentBreakdown: Record<string, number>;
  };
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Gotówka",
  CARD: "Karta",
  BLIK: "BLIK",
  TRANSFER: "Przelew",
  VOUCHER: "Voucher",
};

type TabId = "day-close" | "cash-drawer";

export default function DayClosePage() {
  const [tab, setTab] = useState<TabId>("day-close");
  const [cashEnds, setCashEnds] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<DayCloseResult | null>(null);

  const { data: preview, isLoading, refetch } = useQuery<DayClosePreview>({
    queryKey: ["day-close-preview"],
    queryFn: async () => {
      const r = await fetch("/api/day-close");
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    refetchInterval: 15000,
  });

  const closeMutation = useMutation({
    mutationFn: async () => {
      const shiftCashEnds: Record<string, number> = {};
      for (const [shiftId, val] of Object.entries(cashEnds)) {
        const num = parseFloat(val);
        if (!isNaN(num)) shiftCashEnds[shiftId] = num;
      }
      const r = await fetch("/api/day-close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shiftCashEnds }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Błąd zamknięcia dnia");
      return data as DayCloseResult;
    },
    onSuccess: (data) => {
      setResult(data);
      setConfirmOpen(false);
      refetch();
    },
  });

  const formatCurrency = (v: number) => `${v.toFixed(2)} zł`;
  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return iso;
    }
  };

  // Cash drawer
  const { data: cashDrawerData, refetch: refetchCash } = useQuery({
    queryKey: ["cash-drawer"],
    queryFn: async () => {
      const r = await fetch("/api/cash-drawer");
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    enabled: tab === "cash-drawer",
  });

  const [cashOpType, setCashOpType] = useState<"DEPOSIT" | "WITHDRAWAL">("DEPOSIT");
  const [cashOpAmount, setCashOpAmount] = useState("");
  const [cashOpReason, setCashOpReason] = useState("");
  const [cashOpDialogOpen, setCashOpDialogOpen] = useState(false);

  const cashOpMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/cash-drawer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: cashOpType,
          amount: parseFloat(cashOpAmount) || 0,
          reason: cashOpReason,
        }),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "Błąd");
      }
      return r.json();
    },
    onSuccess: () => {
      refetchCash();
      setCashOpDialogOpen(false);
      setCashOpAmount("");
      setCashOpReason("");
    },
  });

  const openDrawerMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/cash-drawer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "open" }),
      });
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    onSuccess: () => refetchCash(),
  });

  // Success screen
  if (result) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex flex-col items-center gap-3 py-8">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <h1 className="text-2xl font-semibold">Dzień zamknięty</h1>
          <p className="text-muted-foreground">{result.date}</p>
        </div>

        {result.fiscalError && (
          <div className="rounded-md border border-amber-500/30 bg-amber-50 p-4 dark:bg-amber-950/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Raport fiskalny: {result.fiscalError}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={TrendingUp} label="Obrót brutto" value={formatCurrency(result.report.totalGross)} />
          <StatCard icon={Receipt} label="Zamówienia" value={String(result.report.orderCount)} />
          <StatCard icon={Users} label="Goście" value={String(result.report.guestCount)} />
          <StatCard icon={Banknote} label="Śr. rachunek" value={formatCurrency(result.report.avgTicket)} />
        </div>

        <div className="rounded-md border p-4">
          <h3 className="mb-2 text-sm font-medium">Płatności</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Object.entries(result.report.paymentBreakdown)
              .filter(([, v]) => v > 0)
              .map(([method, amount]) => (
                <div key={method} className="flex items-center justify-between rounded bg-muted/50 px-3 py-2">
                  <span className="text-sm">{PAYMENT_LABELS[method] ?? method}</span>
                  <span className="text-sm font-medium tabular-nums">{formatCurrency(amount)}</span>
                </div>
              ))}
          </div>
        </div>

        {result.closedShifts.length > 0 && (
          <div className="rounded-md border p-4">
            <h3 className="mb-2 text-sm font-medium">Zamknięte zmiany</h3>
            {result.closedShifts.map((s) => (
              <div key={s.id} className="flex items-center justify-between border-b py-2 last:border-0">
                <span className="text-sm">{s.userName}</span>
                <span className="text-sm tabular-nums">{formatCurrency(s.cashEnd)}</span>
              </div>
            ))}
          </div>
        )}

        <Button onClick={() => setResult(null)} variant="outline" className="w-full">
          Powrót
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold mr-auto">
          {tab === "day-close" ? "Zamknięcie dnia" : "Szuflada kasowa"}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={tab === "day-close" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("day-close")}
        >
          <CalendarCheck className="mr-1 h-4 w-4" />
          Zamknięcie dnia
        </Button>
        <Button
          variant={tab === "cash-drawer" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("cash-drawer")}
        >
          <Banknote className="mr-1 h-4 w-4" />
          Szuflada kasowa
        </Button>
      </div>

      {/* Cash Drawer Tab */}
      {tab === "cash-drawer" && (
        <div className="space-y-4">
          {/* Current state */}
          {cashDrawerData && (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <StatCard
                  icon={Banknote}
                  label="Stan kasy"
                  value={`${cashDrawerData.drawer.currentAmount.toFixed(2)} zł`}
                />
                <StatCard
                  icon={Clock}
                  label="Ostatnie otwarcie"
                  value={cashDrawerData.drawer.lastOpenedAt
                    ? new Date(cashDrawerData.drawer.lastOpenedAt).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
                    : "—"}
                />
                <StatCard
                  icon={Receipt}
                  label="Ostatnie liczenie"
                  value={cashDrawerData.drawer.lastCountedAt
                    ? new Date(cashDrawerData.drawer.lastCountedAt).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
                    : "—"}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    setCashOpType("DEPOSIT");
                    setCashOpAmount("");
                    setCashOpReason("");
                    setCashOpDialogOpen(true);
                  }}
                >
                  <ArrowDownToLine className="mr-2 h-4 w-4" />
                  Wpłata
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCashOpType("WITHDRAWAL");
                    setCashOpAmount("");
                    setCashOpReason("");
                    setCashOpDialogOpen(true);
                  }}
                >
                  <ArrowUpFromLine className="mr-2 h-4 w-4" />
                  Wypłata
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openDrawerMutation.mutate()}
                  disabled={openDrawerMutation.isPending}
                >
                  <DoorOpen className="mr-2 h-4 w-4" />
                  Otwórz szufladę
                </Button>
              </div>

              {/* Recent operations */}
              {cashDrawerData.operations.length > 0 && (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-2 text-left font-medium">Czas</th>
                        <th className="p-2 text-left font-medium">Typ</th>
                        <th className="p-2 text-right font-medium">Kwota</th>
                        <th className="p-2 text-left font-medium">Powód</th>
                        <th className="p-2 text-left font-medium">Użytkownik</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cashDrawerData.operations.map((op: { id: string; type: string; amount: number; reason: string; userName: string; createdAt: string }) => (
                        <tr key={op.id} className="border-b">
                          <td className="p-2 text-xs tabular-nums">
                            {new Date(op.createdAt).toLocaleString("pl-PL", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="p-2">
                            <span className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                              op.type === "DEPOSIT"
                                ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                                : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                            )}>
                              {op.type === "DEPOSIT" ? "Wpłata" : "Wypłata"}
                            </span>
                          </td>
                          <td className={cn(
                            "p-2 text-right font-medium tabular-nums",
                            op.type === "DEPOSIT" ? "text-green-600" : "text-red-600"
                          )}>
                            {op.type === "DEPOSIT" ? "+" : "-"}{op.amount.toFixed(2)} zł
                          </td>
                          <td className="p-2 text-muted-foreground">{op.reason}</td>
                          <td className="p-2">{op.userName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Cash operation dialog */}
          <Dialog open={cashOpDialogOpen} onOpenChange={setCashOpDialogOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>
                  {cashOpType === "DEPOSIT" ? "Wpłata do kasy" : "Wypłata z kasy"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Kwota (zł)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={cashOpAmount}
                    onChange={(e) => setCashOpAmount(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Powód</label>
                  <Input
                    value={cashOpReason}
                    onChange={(e) => setCashOpReason(e.target.value)}
                    placeholder={cashOpType === "DEPOSIT" ? "np. Wpłata z banku" : "np. Zakup materiałów"}
                    maxLength={200}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCashOpDialogOpen(false)}>
                  Anuluj
                </Button>
                <Button
                  disabled={!cashOpAmount || !cashOpReason.trim() || cashOpMutation.isPending}
                  onClick={() => cashOpMutation.mutate()}
                >
                  {cashOpMutation.isPending ? "Zapisywanie…" : cashOpType === "DEPOSIT" ? "Wpłać" : "Wypłać"}
                </Button>
              </DialogFooter>
              {cashOpMutation.isError && (
                <p className="text-sm text-destructive">
                  {cashOpMutation.error?.message ?? "Wystąpił błąd"}
                </p>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Day Close Tab */}
      {tab === "day-close" && (<div className="space-y-6">

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : preview ? (
        <>
          {/* Warnings */}
          {preview.openOrdersCount > 0 && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-destructive">
                    {preview.openOrdersCount} otwartych zamówień
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Zamknij lub anuluj wszystkie zamówienia przed zamknięciem dnia.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Day summary */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard icon={TrendingUp} label="Obrót brutto" value={formatCurrency(preview.totalGross)} />
            <StatCard icon={Receipt} label="Zamknięte" value={String(preview.closedOrdersCount)} />
            <StatCard icon={XCircle} label="Anulowane" value={String(preview.cancelledOrdersCount)} />
            <StatCard icon={Clock} label="Otwarte zmiany" value={String(preview.openShifts.length)} />
          </div>

          {/* Payment breakdown */}
          <div className="rounded-md border p-4">
            <h3 className="mb-2 text-sm font-medium">Płatności dzisiaj</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.entries(preview.paymentBreakdown)
                .filter(([, v]) => v > 0)
                .map(([method, amount]) => (
                  <div key={method} className="flex items-center justify-between rounded bg-muted/50 px-3 py-2">
                    <span className="text-sm">{PAYMENT_LABELS[method] ?? method}</span>
                    <span className="text-sm font-medium tabular-nums">{formatCurrency(amount)}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Open shifts — cash end input */}
          {preview.openShifts.length > 0 && (
            <div className="rounded-md border p-4">
              <h3 className="mb-3 text-sm font-medium">Rozliczenie zmian</h3>
              <p className="mb-3 text-xs text-muted-foreground">
                Wpisz stan gotówki w kasie na koniec zmiany każdego pracownika.
              </p>
              <div className="space-y-3">
                {preview.openShifts.map((shift) => {
                  const cashEndVal = cashEnds[shift.id] ?? "";
                  const cashEndNum = parseFloat(cashEndVal);
                  const diff = !isNaN(cashEndNum) ? cashEndNum - shift.expectedCash : null;

                  return (
                    <div key={shift.id} className="rounded border p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-medium">{shift.userName}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            od {formatTime(shift.startedAt)}
                          </span>
                        </div>
                        <span className="text-sm tabular-nums">
                          Obrót: {formatCurrency(shift.totalTurnover)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Kasa start:</span>
                          <span className="ml-1 font-medium tabular-nums">{formatCurrency(shift.cashStart)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Gotówka obrót:</span>
                          <span className="ml-1 font-medium tabular-nums">{formatCurrency(shift.cashTurnover)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Oczekiwana:</span>
                          <span className="ml-1 font-medium tabular-nums">{formatCurrency(shift.expectedCash)}</span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <label className="text-sm font-medium whitespace-nowrap">Stan kasy (zł):</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={cashEndVal}
                          onChange={(e) => setCashEnds((prev) => ({ ...prev, [shift.id]: e.target.value }))}
                          placeholder={String(shift.expectedCash)}
                          className="w-32"
                        />
                        {diff !== null && (
                          <span className={cn(
                            "text-xs font-medium tabular-nums",
                            diff === 0 ? "text-green-600" : diff > 0 ? "text-blue-600" : "text-red-600"
                          )}>
                            {diff > 0 ? "+" : ""}{diff.toFixed(2)} zł
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Close button */}
          <Button
            size="lg"
            className="w-full"
            disabled={!preview.canClose}
            onClick={() => setConfirmOpen(true)}
          >
            {preview.canClose
              ? "Zamknij dzień"
              : `Nie można zamknąć — ${preview.openOrdersCount} otwartych zamówień`}
          </Button>
        </>
      ) : (
        <p className="text-muted-foreground">Nie udało się załadować danych.</p>
      )}

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Potwierdzenie zamknięcia dnia</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Ta operacja:
            </p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>Zamknie {preview?.openShifts.length ?? 0} otwartych zmian</li>
              <li>Wydrukuje raport dobowy na drukarce fiskalnej</li>
              <li>Zapisze raport dobowy w systemie</li>
            </ul>
            <p className="text-sm font-medium text-destructive">
              Tej operacji nie można cofnąć.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Anuluj
            </Button>
            <Button
              variant="destructive"
              disabled={closeMutation.isPending}
              onClick={() => closeMutation.mutate()}
            >
              {closeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Zamykanie…
                </>
              ) : (
                "Zamknij dzień"
              )}
            </Button>
          </DialogFooter>
          {closeMutation.isError && (
            <p className="text-sm text-destructive">
              {closeMutation.error?.message ?? "Wystąpił błąd"}
            </p>
          )}
        </DialogContent>
      </Dialog>
      </div>)}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
