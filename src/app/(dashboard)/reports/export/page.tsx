"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import Link from "next/link";

const FORMATS = [
  {
    id: "csv",
    name: "CSV uniwersalny",
    description: "Format CSV z separatorem ; (Excel, LibreOffice)",
    icon: FileSpreadsheet,
    ext: "csv",
  },
  {
    id: "optima",
    name: "Comarch Optima",
    description: "Format CSV zgodny z importem Comarch ERP Optima",
    icon: FileSpreadsheet,
    ext: "csv",
  },
  {
    id: "symfonia",
    name: "Symfonia",
    description: "Format XML zgodny z Sage Symfonia Handel",
    icon: FileText,
    ext: "xml",
  },
  {
    id: "wfirma",
    name: "wFirma",
    description: "Format CSV zgodny z importem wFirma.pl",
    icon: FileSpreadsheet,
    ext: "csv",
  },
];

export default function ExportPage() {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (formatId: string) => {
    setDownloading(formatId);
    try {
      const url = `/api/export?from=${dateFrom}&to=${dateTo}&format=${formatId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Błąd eksportu");

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const filenameMatch = disposition.match(/filename="(.+?)"/);
      const filename = filenameMatch?.[1] ?? `export_${formatId}.${FORMATS.find((f) => f.id === formatId)?.ext ?? "csv"}`;

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      // ignore
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <Download className="h-7 w-7 text-blue-500" />
        <div>
          <h1 className="text-2xl font-bold">Eksport do księgowości</h1>
          <p className="text-sm text-muted-foreground">
            Pobierz dane sprzedaży w formacie systemu księgowego
          </p>
        </div>
      </div>

      {/* Date range */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Od:</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-44" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Do:</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-44" />
        </div>
      </div>

      {/* Format cards */}
      <div className="space-y-3">
        {FORMATS.map((format) => {
          const Icon = format.icon;
          return (
            <div
              key={format.id}
              className="flex items-center justify-between rounded-xl border p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/30">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{format.name}</p>
                  <p className="text-xs text-muted-foreground">{format.description}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => handleDownload(format.id)}
                disabled={downloading === format.id}
              >
                <Download className="h-4 w-4" />
                {downloading === format.id ? "Pobieranie…" : `Pobierz .${format.ext}`}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Eksport zawiera wszystkie zamknięte zamówienia z wybranego okresu:
        pozycje, stawki VAT, formy płatności, numery paragonów i faktur.
      </p>
    </div>
  );
}
