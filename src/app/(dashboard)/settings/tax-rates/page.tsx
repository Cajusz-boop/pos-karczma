"use client";

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
  Receipt,
  Plus,
  RefreshCw,
  ArrowLeft,
  Pencil,
  Star,
} from "lucide-react";
import Link from "next/link";

interface TaxRate {
  id: string;
  name: string;
  ratePercent: number;
  fiscalSymbol: string;
  isDefault: boolean;
  _count: { products: number };
}

export default function TaxRatesPage() {
  const [rates, setRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formRate, setFormRate] = useState("");
  const [formSymbol, setFormSymbol] = useState("");
  const [formDefault, setFormDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tax-rates");
      const data = await res.json();
      setRates((data.rates ?? []).map((r: Record<string, unknown>) => ({
        ...r,
        ratePercent: Number(r.ratePercent),
      })));
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  const openCreate = () => {
    setEditId(null);
    setFormName(""); setFormRate(""); setFormSymbol(""); setFormDefault(false);
    setEditOpen(true);
  };

  const openEdit = (r: TaxRate) => {
    setEditId(r.id);
    setFormName(r.name); setFormRate(String(r.ratePercent)); setFormSymbol(r.fiscalSymbol); setFormDefault(r.isDefault);
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formSymbol.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        await fetch("/api/tax-rates", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, name: formName.trim(), ratePercent: parseFloat(formRate) || 0, fiscalSymbol: formSymbol.trim(), isDefault: formDefault }),
        });
      } else {
        await fetch("/api/tax-rates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formName.trim(), ratePercent: parseFloat(formRate) || 0, fiscalSymbol: formSymbol.trim(), isDefault: formDefault }),
        });
      }
      setEditOpen(false);
      fetchRates();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/settings"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <Receipt className="h-7 w-7 text-green-500" />
          <div>
            <h1 className="text-2xl font-bold">Stawki VAT</h1>
            <p className="text-sm text-muted-foreground">Symbole fiskalne i stawki podatkowe</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchRates} disabled={loading}>
            <RefreshCw className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nowa stawka
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Symbol</th>
              <th className="px-4 py-2 text-left font-medium">Nazwa</th>
              <th className="px-4 py-2 text-right font-medium">Stawka</th>
              <th className="px-4 py-2 text-right font-medium">Produkty</th>
              <th className="px-4 py-2 text-right font-medium">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {rates.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {r.fiscalSymbol}
                  </span>
                </td>
                <td className="px-4 py-2 font-medium">
                  {r.name}
                  {r.isDefault && (
                    <Star className="ml-1 inline h-3.5 w-3.5 text-yellow-500" />
                  )}
                </td>
                <td className="px-4 py-2 text-right tabular-nums font-bold">{r.ratePercent}%</td>
                <td className="px-4 py-2 text-right tabular-nums">{r._count.products}</td>
                <td className="px-4 py-2 text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Symbole fiskalne (A-G) muszą odpowiadać konfiguracji drukarki fiskalnej.
        A=23% (alkohole), B=8% (gastronomia), C=5%, D=0%.
      </p>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editId ? "Edytuj stawkę VAT" : "Nowa stawka VAT"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Nazwa *</label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="np. VAT 23%" autoFocus />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium">Stawka (%)</label>
                <Input type="number" min="0" max="100" step="0.01" value={formRate} onChange={(e) => setFormRate(e.target.value)} placeholder="23" />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium">Symbol fiskalny *</label>
                <Input value={formSymbol} onChange={(e) => setFormSymbol(e.target.value.toUpperCase())} placeholder="A" maxLength={2} className="text-center font-bold text-lg" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={formDefault} onChange={(e) => setFormDefault(e.target.checked)} className="h-4 w-4 rounded" />
              <span className="font-medium">Domyślna stawka</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Anuluj</Button>
            <Button onClick={handleSave} disabled={saving || !formName.trim() || !formSymbol.trim()}>
              {saving ? "Zapisywanie…" : editId ? "Zapisz" : "Utwórz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
