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
  Printer,
  Plus,
  RefreshCw,
  ArrowLeft,
  Pencil,
  Trash2,
  TestTube,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";

interface PrinterData {
  id: string;
  name: string;
  type: string;
  connectionType: string;
  address: string | null;
  port: number | null;
  model: string | null;
  isActive: boolean;
  categories: { id: string; name: string }[];
}

interface CategoryOption {
  id: string;
  name: string;
}

const PRINTER_TYPES = [
  { value: "FISCAL", label: "Fiskalna" },
  { value: "KITCHEN", label: "Kuchnia" },
  { value: "BAR", label: "Bar" },
  { value: "SYSTEM", label: "Systemowa" },
];

const CONNECTION_TYPES = [
  { value: "USB", label: "USB" },
  { value: "TCP", label: "TCP/IP" },
  { value: "COM", label: "COM (szeregowy)" },
];

export default function PrintersPage() {
  const [printers, setPrinters] = useState<PrinterData[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Form
  const [fName, setFName] = useState("");
  const [fType, setFType] = useState("KITCHEN");
  const [fConn, setFConn] = useState("USB");
  const [fAddr, setFAddr] = useState("");
  const [fPort, setFPort] = useState("");
  const [fModel, setFModel] = useState("");
  const [fCats, setFCats] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const fetchPrinters = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        fetch("/api/printers"),
        fetch("/api/categories"),
      ]);
      const pData = await pRes.json();
      const cData = await cRes.json();
      setPrinters(Array.isArray(pData) ? pData : []);
      setCategories(cData.categories ?? []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPrinters(); }, [fetchPrinters]);

  const openCreate = () => {
    setEditId(null);
    setFName(""); setFType("KITCHEN"); setFConn("USB"); setFAddr(""); setFPort(""); setFModel("");
    setFCats(new Set());
    setEditOpen(true);
  };

  const openEdit = (p: PrinterData) => {
    setEditId(p.id);
    setFName(p.name); setFType(p.type); setFConn(p.connectionType);
    setFAddr(p.address ?? ""); setFPort(p.port ? String(p.port) : ""); setFModel(p.model ?? "");
    setFCats(new Set(p.categories.map((c) => c.id)));
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!fName.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        await fetch("/api/printers", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editId,
            name: fName.trim(),
            type: fType,
            connectionType: fConn,
            address: fAddr.trim() || null,
            port: fPort ? parseInt(fPort) : null,
            model: fModel.trim() || null,
            categoryIds: Array.from(fCats),
          }),
        });
      } else {
        const res = await fetch("/api/printers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: fName.trim(),
            type: fType,
            connectionType: fConn,
            address: fAddr.trim() || null,
            port: fPort ? parseInt(fPort) : null,
            model: fModel.trim() || null,
          }),
        });
        const data = await res.json();
        // Assign categories
        if (data.id && fCats.size > 0) {
          await fetch("/api/printers", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: data.id, categoryIds: Array.from(fCats) }),
          });
        }
      }
      setEditOpen(false); fetchPrinters();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Usunąć drukarkę?")) return;
    await fetch(`/api/printers?id=${id}`, { method: "DELETE" });
    fetchPrinters();
  };

  const toggleActive = async (p: PrinterData) => {
    await fetch("/api/printers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, isActive: !p.isActive }),
    });
    fetchPrinters();
  };

  const handleTest = (p: PrinterData) => {
    setTestResult(`Test drukarki "${p.name}" (${p.connectionType}${p.address ? `: ${p.address}` : ""}):\n✅ Połączenie OK (symulacja)\n✅ Wydruk testowy wysłany`);
    setTimeout(() => setTestResult(null), 5000);
  };

  const toggleCat = (catId: string) => {
    setFCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId); else next.add(catId);
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/settings"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <Printer className="h-7 w-7 text-slate-500" />
          <div>
            <h1 className="text-2xl font-bold">Drukarki</h1>
            <p className="text-sm text-muted-foreground">{printers.length} drukarek</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchPrinters} disabled={loading}>
            <RefreshCw className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nowa drukarka
          </Button>
        </div>
      </div>

      {testResult && (
        <pre className="rounded-lg border bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 whitespace-pre-wrap">
          {testResult}
        </pre>
      )}

      <div className="space-y-2">
        {printers.map((p) => (
          <div key={p.id} className={cn("rounded-xl border p-4", !p.isActive && "opacity-50")}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Printer className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{p.name}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{PRINTER_TYPES.find((t) => t.value === p.type)?.label}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.connectionType}{p.address ? `: ${p.address}` : ""}{p.port ? `:${p.port}` : ""}
                  {p.model && ` • ${p.model}`}
                </p>
                {p.categories.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.categories.map((c) => (
                      <span key={c.id} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {c.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleTest(p)} title="Test wydruku">
                  <TestTube className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(p)}>
                  {p.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editId ? "Edytuj drukarkę" : "Nowa drukarka"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="mb-1 block text-sm font-medium">Nazwa *</label>
              <Input value={fName} onChange={(e) => setFName(e.target.value)} placeholder="np. Kuchnia Ciepła" autoFocus /></div>
            <div className="flex gap-3">
              <div className="flex-1"><label className="mb-1 block text-sm font-medium">Typ</label>
                <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={fType} onChange={(e) => setFType(e.target.value)}>
                  {PRINTER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select></div>
              <div className="flex-1"><label className="mb-1 block text-sm font-medium">Połączenie</label>
                <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={fConn} onChange={(e) => setFConn(e.target.value)}>
                  {CONNECTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select></div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1"><label className="mb-1 block text-sm font-medium">Adres IP / ścieżka</label>
                <Input value={fAddr} onChange={(e) => setFAddr(e.target.value)} placeholder="192.168.1.100" /></div>
              <div className="w-24"><label className="mb-1 block text-sm font-medium">Port</label>
                <Input type="number" value={fPort} onChange={(e) => setFPort(e.target.value)} placeholder="9100" /></div>
            </div>
            <div><label className="mb-1 block text-sm font-medium">Model</label>
              <Input value={fModel} onChange={(e) => setFModel(e.target.value)} placeholder="np. Posnet Thermal" /></div>
            <div>
              <label className="mb-1 block text-sm font-medium">Przypisane kategorie</label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCat(c.id)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                      fCats.has(c.id)
                        ? "bg-blue-500 text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Anuluj</Button>
            <Button onClick={handleSave} disabled={saving || !fName.trim()}>
              {saving ? "Zapisywanie…" : editId ? "Zapisz" : "Utwórz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
