"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
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
  Gift,
  Plus,
  Search,
  RefreshCw,
  Copy,
  Ban,
  Check,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface Voucher {
  id: string;
  code: string;
  initialValue: number;
  balance: number;
  isActive: boolean;
  expiresAt: string | null;
  customerName: string | null;
  note: string | null;
  createdAt: string;
  soldByUser: { id: string; name: string } | null;
  _count?: { payments: number };
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchCode, setSearchCode] = useState("");
  const [searchResult, setSearchResult] = useState<Voucher | null>(null);
  const [searching, setSearching] = useState(false);

  // Create form
  const [newValue, setNewValue] = useState("");
  const [newName, setNewName] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vouchers");
      const data = await res.json();
      setVouchers(
        (data.vouchers ?? []).map((v: Record<string, unknown>) => ({
          ...v,
          initialValue: Number(v.initialValue),
          balance: Number(v.balance),
        }))
      );
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const handleSearch = async () => {
    if (!searchCode.trim()) return;
    setSearching(true);
    setSearchResult(null);
    try {
      const res = await fetch(`/api/vouchers?code=${encodeURIComponent(searchCode.trim())}`);
      const data = await res.json();
      if (data.voucher) {
        setSearchResult({
          ...data.voucher,
          initialValue: Number(data.voucher.initialValue),
          balance: Number(data.voucher.balance),
        });
      }
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  };

  const handleCreate = async () => {
    const value = parseFloat(newValue.replace(",", "."));
    if (isNaN(value) || value <= 0) return;
    setCreating(true);
    try {
      const res = await fetch("/api/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initialValue: value,
          customerName: newName.trim() || undefined,
          note: newNote.trim() || undefined,
          expiresAt: newExpiry ? new Date(newExpiry).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (data.voucher) {
        setCreatedCode(data.voucher.code);
        fetchVouchers();
      }
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await fetch("/api/vouchers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: false }),
      });
      fetchVouchers();
    } catch {
      // ignore
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetCreate = () => {
    setNewValue("");
    setNewName("");
    setNewNote("");
    setNewExpiry("");
    setCreatedCode(null);
    setCreateOpen(false);
  };

  const activeVouchers = vouchers.filter((v) => v.isActive && v.balance > 0);
  const totalBalance = activeVouchers.reduce((s, v) => s + v.balance, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Gift className="h-7 w-7 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold">Vouchery / Karty podarunkowe</h1>
            <p className="text-sm text-muted-foreground">
              {activeVouchers.length} aktywnych, łączne saldo: {totalBalance.toFixed(2)} zł
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchVouchers} disabled={loading}>
            <RefreshCw className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")} />
            Odśwież
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nowy voucher
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Wpisz kod vouchera (np. GV-XXXX-XXXX)"
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
          className="font-mono"
          onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
        />
        <Button variant="outline" onClick={handleSearch} disabled={searching || !searchCode.trim()}>
          <Search className="mr-1.5 h-4 w-4" />
          Sprawdź saldo
        </Button>
      </div>

      {/* Search result */}
      {searchResult && (
        <div className="rounded-xl border-2 border-orange-300 bg-orange-50 p-4 dark:bg-orange-950/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-lg font-bold">{searchResult.code}</p>
              <p className="text-sm text-muted-foreground">
                {searchResult.customerName || "Bez imienia"} • Utworzony: {new Date(searchResult.createdAt).toLocaleDateString("pl-PL")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black tabular-nums text-orange-600">
                {searchResult.balance.toFixed(2)} zł
              </p>
              <p className="text-xs text-muted-foreground">
                z {searchResult.initialValue.toFixed(2)} zł
              </p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              searchResult.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
            )}>
              {searchResult.isActive ? "Aktywny" : "Dezaktywowany"}
            </span>
            {searchResult.expiresAt && (
              <span className="text-xs text-muted-foreground">
                Ważny do: {new Date(searchResult.expiresAt).toLocaleDateString("pl-PL")}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Voucher list */}
      <div className="space-y-2">
        {vouchers.map((v) => (
          <div
            key={v.id}
            className={cn(
              "flex items-center justify-between rounded-lg border p-3",
              !v.isActive && "opacity-50"
            )}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => copyCode(v.code)}
                className="flex items-center gap-1.5 rounded bg-muted px-2 py-1 font-mono text-sm font-bold hover:bg-muted/80"
                title="Kopiuj kod"
              >
                {v.code}
                <Copy className="h-3 w-3 text-muted-foreground" />
              </button>
              <div>
                <p className="text-sm">{v.customerName || "—"}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(v.createdAt).toLocaleDateString("pl-PL")}
                  {v.soldByUser && ` • ${v.soldByUser.name}`}
                  {v._count?.payments ? ` • ${v._count.payments} użyć` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className={cn(
                  "font-bold tabular-nums",
                  v.balance > 0 ? "text-orange-600" : "text-muted-foreground"
                )}>
                  {Number(v.balance).toFixed(2)} zł
                </p>
                <p className="text-xs text-muted-foreground">
                  / {Number(v.initialValue).toFixed(2)} zł
                </p>
              </div>
              {v.isActive && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDeactivate(v.id)}
                  title="Dezaktywuj"
                >
                  <Ban className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
        {!loading && vouchers.length === 0 && (
          <div className="py-12 text-center">
            <Gift className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">Brak voucherów</p>
            <p className="text-sm text-muted-foreground">Utwórz pierwszy voucher przyciskiem powyżej</p>
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={(v) => { if (!v) resetCreate(); else setCreateOpen(true); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-orange-500" />
              {createdCode ? "Voucher utworzony!" : "Nowy voucher"}
            </DialogTitle>
          </DialogHeader>

          {createdCode ? (
            <div className="space-y-4 text-center">
              <div className="rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 p-6 dark:bg-orange-950/20">
                <p className="text-sm text-muted-foreground">Kod vouchera</p>
                <p className="mt-1 font-mono text-3xl font-black tracking-wider text-orange-600">
                  {createdCode}
                </p>
              </div>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => copyCode(createdCode)}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Skopiowano!" : "Kopiuj kod"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Przekaż kod klientowi lub wydrukuj na kartce
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Wartość (zł) *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="np. 100"
                  className="text-lg font-bold"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Imię klienta</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="opcjonalnie"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Data ważności</label>
                <Input
                  type="date"
                  value={newExpiry}
                  onChange={(e) => setNewExpiry(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Notatka</label>
                <Input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="opcjonalnie"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {createdCode ? (
              <Button onClick={resetCreate}>Zamknij</Button>
            ) : (
              <>
                <Button variant="outline" onClick={resetCreate}>Anuluj</Button>
                <Button
                  onClick={handleCreate}
                  disabled={creating || !newValue.trim()}
                  className="gap-2"
                >
                  <Gift className="h-4 w-4" />
                  {creating ? "Tworzenie…" : "Utwórz voucher"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
