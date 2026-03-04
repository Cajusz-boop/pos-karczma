"use client";

export const dynamic = "force-dynamic";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Upload,
  Download,
  FileSpreadsheet,
  Check,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface ImportResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export default function MenuImportPage() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [mode, setMode] = useState<"upsert" | "create" | "update">("upsert");
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvContent, setCsvContent] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCsvContent(ev.target?.result as string);
    };
    reader.readAsText(file, "utf-8");
  };

  const handleImport = async () => {
    if (!csvContent) return;
    setImporting(true);
    setResult(null);
    try {
      const res = await fetch("/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvContent, mode }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ total: 0, created: 0, updated: 0, skipped: 0, errors: ["Błąd połączenia"] });
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch("/api/products/export");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `menu_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      // ignore
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <FileSpreadsheet className="h-7 w-7 text-green-500" />
        <div>
          <h1 className="text-2xl font-bold">Import / Eksport menu</h1>
          <p className="text-sm text-muted-foreground">Zarządzaj produktami przez plik CSV</p>
        </div>
      </div>

      {/* Export */}
      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Download className="h-5 w-5 text-blue-500" />
          Eksport menu
        </h2>
        <p className="text-sm text-muted-foreground">
          Pobierz wszystkie produkty jako plik CSV (separator: średnik, kodowanie: UTF-8).
        </p>
        <Button variant="outline" onClick={handleExport} className="gap-1.5">
          <Download className="h-4 w-4" />
          Pobierz CSV
        </Button>
      </div>

      {/* Import */}
      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Upload className="h-5 w-5 text-emerald-500" />
          Import menu
        </h2>
        <p className="text-sm text-muted-foreground">
          Wgraj plik CSV z produktami. Format: Nazwa;Nazwa skrócona;Kategoria;Cena brutto;Koszt;Stawka VAT;Aktywny
        </p>

        <div className="flex items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-1.5">
            <Upload className="h-4 w-4" />
            {fileName ?? "Wybierz plik CSV"}
          </Button>
        </div>

        {csvContent && (
          <>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Tryb:</label>
              <select
                className="rounded-lg border bg-background px-3 py-2 text-sm"
                value={mode}
                onChange={(e) => setMode(e.target.value as typeof mode)}
              >
                <option value="upsert">Utwórz nowe + aktualizuj istniejące</option>
                <option value="create">Tylko twórz nowe (pomijaj istniejące)</option>
                <option value="update">Tylko aktualizuj istniejące (pomijaj nowe)</option>
              </select>
            </div>

            <Button onClick={handleImport} disabled={importing} className="gap-1.5">
              <Upload className="h-4 w-4" />
              {importing ? "Importowanie…" : "Importuj"}
            </Button>
          </>
        )}

        {result && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-2">
              {result.errors.length === 0 ? (
                <Check className="h-5 w-5 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              )}
              <span className="font-semibold">
                Import zakończony
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-sm">
              <div>
                <p className="text-2xl font-bold">{result.total}</p>
                <p className="text-xs text-muted-foreground">Wierszy</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{result.created}</p>
                <p className="text-xs text-muted-foreground">Utworzono</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{result.updated}</p>
                <p className="text-xs text-muted-foreground">Zaktualizowano</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-muted-foreground">{result.skipped}</p>
                <p className="text-xs text-muted-foreground">Pominięto</p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <details>
                <summary className="cursor-pointer text-xs text-amber-600">
                  {result.errors.length} błędów
                </summary>
                <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium">Format pliku CSV:</p>
        <p>Separator: średnik (;) • Kodowanie: UTF-8 • Pierwszy wiersz: nagłówek</p>
        <p>Kolumny: Nazwa;Nazwa skrócona;Kategoria;Cena brutto;Koszt;Stawka VAT;Aktywny</p>
        <p>Stawka VAT: symbol fiskalny (A, B, C) lub procent (23%, 8%)</p>
        <p>Aktywny: TAK lub NIE</p>
        <p>Jeśli kategoria nie istnieje — zostanie utworzona automatycznie.</p>
      </div>
    </div>
  );
}
