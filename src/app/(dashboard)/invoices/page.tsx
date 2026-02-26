"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Clock, XCircle, AlertCircle, RefreshCw } from "lucide-react";

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  type: string;
  buyerName: string | null;
  buyerNip: string | null;
  netTotal: number;
  vatTotal: number;
  grossTotal: number;
  issueDate: string;
  ksefStatus: string;
  ksefRefNumber: string | null;
  ksefErrorMessage: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  STANDARD: "VAT",
  ADVANCE: "Zaliczkowa",
  FINAL: "Końcowa",
  CORRECTION: "Korekta",
};

const KSEF_ICONS: Record<string, React.ReactNode> = {
  SENT: <CheckCircle className="h-4 w-4 text-green-600" />,
  ACCEPTED: <CheckCircle className="h-4 w-4 text-green-600" />,
  PENDING: <Clock className="h-4 w-4 text-amber-600" />,
  OFFLINE_QUEUED: <AlertCircle className="h-4 w-4 text-amber-600" />,
  REJECTED: <XCircle className="h-4 w-4 text-destructive" />,
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [ksefFilter, setKsefFilter] = useState("");
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set("type", typeFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (ksefFilter) params.set("ksefStatus", ksefFilter);
      const res = await fetch(`/api/invoices?${params}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, dateFrom, dateTo, ksefFilter]);

  const retryKsef = async (invoiceId: string) => {
    setRetryingId(invoiceId);
    try {
      const res = await fetch("/api/ksef", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      const data = await res.json();
      if (data.ok) fetchInvoices();
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Rejestr faktur</h1>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
        <span className="text-sm text-muted-foreground">Filtry:</span>
        <select
          className="rounded border px-2 py-1 text-sm"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">Wszystkie typy</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <Input
          type="date"
          className="w-40"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          placeholder="Od"
        />
        <Input
          type="date"
          className="w-40"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          placeholder="Do"
        />
        <select
          className="rounded border px-2 py-1 text-sm"
          value={ksefFilter}
          onChange={(e) => setKsefFilter(e.target.value)}
        >
          <option value="">Wszystkie statusy KSeF</option>
          <option value="PENDING">Oczekuje</option>
          <option value="SENT">Wysłana</option>
          <option value="ACCEPTED">Zaakceptowana</option>
          <option value="REJECTED">Odrzucona</option>
          <option value="OFFLINE_QUEUED">W kolejce</option>
        </select>
        <Button variant="outline" size="sm" onClick={fetchInvoices}>Odśwież</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Ładowanie…</p>
      ) : (
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-left">Numer</th>
                <th className="p-2 text-left">Typ</th>
                <th className="p-2 text-left">Kontrahent</th>
                <th className="p-2 text-right">Brutto</th>
                <th className="p-2 text-left">Data</th>
                <th className="p-2 text-left">KSeF</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t">
                  <td className="p-2 font-mono">{inv.invoiceNumber}</td>
                  <td className="p-2">{TYPE_LABELS[inv.type] ?? inv.type}</td>
                  <td className="p-2">{inv.buyerName || inv.buyerNip || "—"}</td>
                  <td className="p-2 text-right">{Number(inv.grossTotal).toFixed(2)} zł</td>
                  <td className="p-2">{new Date(inv.issueDate).toLocaleDateString("pl-PL")}</td>
                  <td className="p-2">
                    <span className="inline-flex items-center gap-1">
                      {KSEF_ICONS[inv.ksefStatus] ?? <Clock className="h-4 w-4 text-muted-foreground" />}
                      {inv.ksefRefNumber ? (
                        <span className="max-w-[120px] truncate text-muted-foreground" title={inv.ksefRefNumber}>
                          {inv.ksefRefNumber}
                        </span>
                      ) : (
                        inv.ksefStatus
                      )}
                    </span>
                    {inv.ksefErrorMessage && (
                      <span className="block text-xs text-destructive" title={inv.ksefErrorMessage}>
                        {inv.ksefErrorMessage.slice(0, 40)}…
                      </span>
                    )}
                  </td>
                  <td className="p-2">
                    {(inv.ksefStatus === "PENDING" || inv.ksefStatus === "REJECTED" || inv.ksefStatus === "OFFLINE_QUEUED") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => retryKsef(inv.id)}
                        disabled={retryingId === inv.id}
                      >
                        <RefreshCw className={retryingId === inv.id ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && invoices.length === 0 && (
        <p className="text-muted-foreground">Brak faktur dla wybranych filtrów.</p>
      )}
    </div>
  );
}
