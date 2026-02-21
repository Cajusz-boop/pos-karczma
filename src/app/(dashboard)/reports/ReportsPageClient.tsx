"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileSpreadsheet, BarChart3, Users, Package, Receipt, UtensilsCrossed, FileText, Shield } from "lucide-react";
import { format, subDays } from "date-fns";
import { pl } from "date-fns/locale";

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Gotówka",
  CARD: "Karta",
  BLIK: "Blik",
  TRANSFER: "Przelew",
  VOUCHER: "Voucher",
};

type TabId = "daily" | "shift" | "products" | "warehouse" | "vat" | "banquets" | "audit";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "daily", label: "Dobowy", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "shift", label: "Zmianowy", icon: <Users className="h-4 w-4" /> },
  { id: "products", label: "Produktowy", icon: <Package className="h-4 w-4" /> },
  { id: "warehouse", label: "Magazynowy", icon: <Package className="h-4 w-4" /> },
  { id: "vat", label: "VAT", icon: <Receipt className="h-4 w-4" /> },
  { id: "banquets", label: "Bankiety", icon: <UtensilsCrossed className="h-4 w-4" /> },
  { id: "audit", label: "Audyt", icon: <Shield className="h-4 w-4" /> },
];

export default function ReportsPageClient() {
  const [tab, setTab] = useState<TabId>("daily");
  const today = format(new Date(), "yyyy-MM-dd");
  const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
  const [date, setDate] = useState(today);
  const [dateFrom, setDateFrom] = useState(weekAgo);
  const [dateTo, setDateTo] = useState(today);

  const exportUrl = () => {
    const params = new URLSearchParams();
    params.set("type", tab);
    if (tab === "daily" || tab === "warehouse") params.set("date", date);
    else {
      params.set("dateFrom", dateFrom);
      params.set("dateTo", dateTo);
    }
    return `/api/reports/export?${params}`;
  };

  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ["report-daily", date],
    queryFn: async () => {
      const r = await fetch(`/api/reports/daily?date=${date}`);
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    enabled: tab === "daily",
  });

  const { data: shiftData, isLoading: shiftLoading } = useQuery({
    queryKey: ["report-shift", dateFrom, dateTo],
    queryFn: async () => {
      const r = await fetch(`/api/reports/shift?dateFrom=${dateFrom}&dateTo=${dateTo}`);
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    enabled: tab === "shift",
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["report-products", dateFrom, dateTo],
    queryFn: async () => {
      const r = await fetch(`/api/reports/products?dateFrom=${dateFrom}&dateTo=${dateTo}&limit=30`);
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    enabled: tab === "products",
  });

  const { data: warehouseData, isLoading: warehouseLoading } = useQuery({
    queryKey: ["report-warehouse", date],
    queryFn: async () => {
      const r = await fetch(`/api/reports/warehouse?date=${date}`);
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    enabled: tab === "warehouse",
  });

  const { data: vatData, isLoading: vatLoading } = useQuery({
    queryKey: ["report-vat", dateFrom, dateTo],
    queryFn: async () => {
      const r = await fetch(`/api/reports/vat?dateFrom=${dateFrom}&dateTo=${dateTo}`);
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    enabled: tab === "vat",
  });

  const { data: banquetsData, isLoading: banquetsLoading } = useQuery({
    queryKey: ["report-banquets", dateFrom, dateTo],
    queryFn: async () => {
      const r = await fetch(`/api/reports/banquets?dateFrom=${dateFrom}&dateTo=${dateTo}`);
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    enabled: tab === "banquets",
  });

  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ["report-audit", dateFrom, dateTo],
    queryFn: async () => {
      const r = await fetch(`/api/reports/audit?dateFrom=${dateFrom}&dateTo=${dateTo}`);
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    enabled: tab === "audit",
  });

  const loading =
    (tab === "daily" && dailyLoading) ||
    (tab === "shift" && shiftLoading) ||
    (tab === "products" && productsLoading) ||
    (tab === "warehouse" && warehouseLoading) ||
    (tab === "vat" && vatLoading) ||
    (tab === "banquets" && banquetsLoading) ||
    (tab === "audit" && auditLoading);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Raporty</h1>
        <a href={exportUrl()} target="_blank" rel="noopener noreferrer">
          <Button variant="outline">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Eksportuj do XLSX
          </Button>
        </a>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-2">
        {TABS.map((t) => (
          <Button
            key={t.id}
            variant={tab === t.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setTab(t.id)}
          >
            {t.icon}
            <span className="ml-1">{t.label}</span>
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 rounded-lg border p-4">
        {(tab === "daily" || tab === "warehouse") && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Data</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
          </div>
        )}
        {tab !== "daily" && tab !== "warehouse" && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium">Od</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium">Do</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
            </div>
          </>
        )}
      </div>

      {loading && <p className="text-muted-foreground">Ładowanie…</p>}

      {!loading && tab === "daily" && dailyData && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Obrót brutto</p>
              <p className="text-2xl font-semibold">{dailyData.totalGross?.toFixed(2)} zł</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Obrót netto</p>
              <p className="text-2xl font-semibold">{dailyData.totalNet?.toFixed(2)} zł</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Paragony / Faktury</p>
              <p className="text-2xl font-semibold">{dailyData.receiptCount} / {dailyData.invoiceCount}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Goście / Śr. rachunek</p>
              <p className="text-2xl font-semibold">{dailyData.guestCount} / {dailyData.avgTicket?.toFixed(2)} zł</p>
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <p className="mb-2 font-medium">Płatności</p>
            <div className="flex flex-wrap gap-4">
              {Object.entries(dailyData.paymentBreakdownJson ?? {}).map(([method, amount]) => (
                <span key={method}>{PAYMENT_LABELS[method] ?? method}: <strong>{Number(amount).toFixed(2)} zł</strong></span>
              ))}
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <p className="mb-2 font-medium">VAT</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Stawka</th>
                    <th className="p-2 text-right">Netto</th>
                    <th className="p-2 text-right">VAT</th>
                    <th className="p-2 text-right">Brutto</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(dailyData.vatBreakdownJson ?? {}).map(([rate, v]) => (
                    <tr key={rate} className="border-b">
                      <td className="p-2">{rate}</td>
                      <td className="p-2 text-right">{(v as { net: number }).net?.toFixed(2)} zł</td>
                      <td className="p-2 text-right">{(v as { vat: number }).vat?.toFixed(2)} zł</td>
                      <td className="p-2 text-right">{(v as { gross: number }).gross?.toFixed(2)} zł</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!loading && tab === "shift" && shiftData && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-2 text-left">Kelner</th>
                <th className="p-2 text-right">Zamówienia</th>
                <th className="p-2 text-right">Obrót</th>
                <th className="p-2 text-right">Goście</th>
                <th className="p-2 text-right">Napiwki</th>
                <th className="p-2 text-right">Storna</th>
              </tr>
            </thead>
            <tbody>
              {(shiftData.shifts ?? []).map((s: { userName: string; orderCount: number; totalGross: number; guestCount: number; tipsTotal: number; cancelCount: number; cancelAmount: number }) => (
                <tr key={s.userName} className="border-b">
                  <td className="p-2 font-medium">{s.userName}</td>
                  <td className="p-2 text-right">{s.orderCount}</td>
                  <td className="p-2 text-right">{s.totalGross?.toFixed(2)} zł</td>
                  <td className="p-2 text-right">{s.guestCount}</td>
                  <td className="p-2 text-right">{s.tipsTotal?.toFixed(2)} zł</td>
                  <td className="p-2 text-right">{s.cancelCount} ({s.cancelAmount?.toFixed(2)} zł)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === "products" && productsData && (
        <div className="space-y-4">
          <div>
            <p className="mb-2 font-medium">TOP 30 wg wartości</p>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left">Produkt</th>
                    <th className="p-2 text-right">Ilość</th>
                    <th className="p-2 text-right">Obrót brutto</th>
                  </tr>
                </thead>
                <tbody>
                  {(productsData.topByValue ?? []).map((r: { name: string; qty: number; gross: number }, i: number) => (
                    <tr key={i} className="border-b">
                      <td className="p-2">{r.name}</td>
                      <td className="p-2 text-right">{r.qty}</td>
                      <td className="p-2 text-right">{r.gross?.toFixed(2)} zł</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!loading && tab === "warehouse" && warehouseData && (
        <div className="space-y-4">
          {(warehouseData.warehouses ?? []).map((w: { id: string; name: string; type: string; itemCount: number; totalValue: number }) => (
            <div key={w.id} className="rounded-lg border p-4">
              <p className="font-medium">{w.name} ({w.type}) — {w.itemCount} pozycji, wartość: {w.totalValue?.toFixed(2)} zł</p>
            </div>
          ))}
          {warehouseData.lossesCount > 0 && (
            <p className="text-sm text-muted-foreground">Straty RW: {warehouseData.lossesCount} dokumentów</p>
          )}
        </div>
      )}

      {!loading && tab === "vat" && vatData && (
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <p className="font-medium">Podsumowanie: {vatData.summary?.invoiceCount} faktur, netto: {vatData.summary?.totalNet?.toFixed(2)} zł, VAT: {vatData.summary?.totalVat?.toFixed(2)} zł, brutto: {vatData.summary?.totalGross?.toFixed(2)} zł</p>
          </div>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-left">Numer</th>
                  <th className="p-2 text-left">Kontrahent</th>
                  <th className="p-2 text-right">Netto</th>
                  <th className="p-2 text-right">VAT</th>
                  <th className="p-2 text-right">Brutto</th>
                  <th className="p-2 text-left">Data</th>
                </tr>
              </thead>
              <tbody>
                {(vatData.invoices ?? []).slice(0, 50).map((i: { invoiceNumber: string; buyerName: string | null; netTotal: number; vatTotal: number; grossTotal: number; issueDate: string }) => (
                  <tr key={i.invoiceNumber} className="border-b">
                    <td className="p-2">{i.invoiceNumber}</td>
                    <td className="p-2">{i.buyerName ?? "—"}</td>
                    <td className="p-2 text-right">{Number(i.netTotal).toFixed(2)}</td>
                    <td className="p-2 text-right">{Number(i.vatTotal).toFixed(2)}</td>
                    <td className="p-2 text-right">{Number(i.grossTotal).toFixed(2)}</td>
                    <td className="p-2">{i.issueDate?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && tab === "banquets" && banquetsData && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-2 text-left">Data</th>
                <th className="p-2 text-left">Typ</th>
                <th className="p-2 text-left">Goście</th>
                <th className="p-2 text-right">Cena/os</th>
                <th className="p-2 text-right">Zaliczka</th>
                <th className="p-2 text-right">Obrót</th>
              </tr>
            </thead>
            <tbody>
              {(banquetsData.events ?? []).map((e: { date: string; eventType: string; guestCount: number; pricePerPerson: number; depositPaid: number; turnover: number }) => (
                <tr key={e.date + e.eventType} className="border-b">
                  <td className="p-2">{e.date}</td>
                  <td className="p-2">{e.eventType}</td>
                  <td className="p-2">{e.guestCount}</td>
                  <td className="p-2 text-right">{e.pricePerPerson?.toFixed(2)} zł</td>
                  <td className="p-2 text-right">{e.depositPaid?.toFixed(2)} zł</td>
                  <td className="p-2 text-right">{e.turnover?.toFixed(2)} zł</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === "audit" && auditData && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-2 text-left">Data i godzina</th>
                <th className="p-2 text-left">Użytkownik</th>
                <th className="p-2 text-left">Akcja</th>
                <th className="p-2 text-left">Encja</th>
                <th className="p-2 text-left">ID</th>
              </tr>
            </thead>
            <tbody>
              {(auditData.logs ?? []).map((l: { id: string; timestamp: string; userName: string; action: string; entityType: string; entityId: string | null }) => (
                <tr key={l.id} className="border-b">
                  <td className="p-2">{format(new Date(l.timestamp), "d MMM yyyy HH:mm", { locale: pl })}</td>
                  <td className="p-2">{l.userName}</td>
                  <td className="p-2">{l.action}</td>
                  <td className="p-2">{l.entityType}</td>
                  <td className="p-2">{l.entityId ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
