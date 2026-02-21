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
  Settings2,
  Plus,
  RefreshCw,
  ArrowLeft,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface Modifier {
  id: string;
  name: string;
  priceDelta: number;
  sortOrder: number;
}

interface ModifierGroup {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  modifiers: Modifier[];
  _count: { products: number };
}

export default function ModifiersPage() {
  const [groups, setGroups] = useState<ModifierGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Group dialog
  const [groupOpen, setGroupOpen] = useState(false);
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [gName, setGName] = useState("");
  const [gMin, setGMin] = useState("0");
  const [gMax, setGMax] = useState("1");
  const [gRequired, setGRequired] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modifier dialog
  const [modOpen, setModOpen] = useState(false);
  const [modGroupId, setModGroupId] = useState("");
  const [editModId, setEditModId] = useState<string | null>(null);
  const [mName, setMName] = useState("");
  const [mPrice, setMPrice] = useState("0");

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/modifiers");
      const data = await res.json();
      setGroups((data.groups ?? []).map((g: Record<string, unknown>) => ({
        ...g,
        modifiers: (g.modifiers as Modifier[]).map((m) => ({
          ...m,
          priceDelta: Number(m.priceDelta),
        })),
      })));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Group CRUD
  const openCreateGroup = () => {
    setEditGroupId(null);
    setGName(""); setGMin("0"); setGMax("1"); setGRequired(false);
    setGroupOpen(true);
  };

  const openEditGroup = (g: ModifierGroup) => {
    setEditGroupId(g.id);
    setGName(g.name); setGMin(String(g.minSelect)); setGMax(String(g.maxSelect)); setGRequired(g.isRequired);
    setGroupOpen(true);
  };

  const saveGroup = async () => {
    if (!gName.trim()) return;
    setSaving(true);
    try {
      if (editGroupId) {
        await fetch("/api/modifiers", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editGroupId, name: gName.trim(), minSelect: parseInt(gMin) || 0, maxSelect: parseInt(gMax) || 1, isRequired: gRequired }),
        });
      } else {
        await fetch("/api/modifiers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: gName.trim(), minSelect: parseInt(gMin) || 0, maxSelect: parseInt(gMax) || 1, isRequired: gRequired }),
        });
      }
      setGroupOpen(false);
      fetchGroups();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const deleteGroup = async (id: string) => {
    if (!confirm("Usunąć grupę modyfikatorów?")) return;
    const res = await fetch(`/api/modifiers?groupId=${id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); alert(d.error); return; }
    fetchGroups();
  };

  // Modifier CRUD
  const openAddModifier = (groupId: string) => {
    setEditModId(null);
    setModGroupId(groupId);
    setMName(""); setMPrice("0");
    setModOpen(true);
  };

  const openEditModifier = (groupId: string, m: Modifier) => {
    setEditModId(m.id);
    setModGroupId(groupId);
    setMName(m.name); setMPrice(String(m.priceDelta));
    setModOpen(true);
  };

  const saveModifier = async () => {
    if (!mName.trim()) return;
    setSaving(true);
    try {
      if (editModId) {
        await fetch("/api/modifiers", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modifierId: editModId, name: mName.trim(), priceDelta: parseFloat(mPrice) || 0 }),
        });
      } else {
        await fetch("/api/modifiers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ groupId: modGroupId, name: mName.trim(), priceDelta: parseFloat(mPrice) || 0 }),
        });
      }
      setModOpen(false);
      fetchGroups();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const deleteModifier = async (id: string) => {
    await fetch(`/api/modifiers?modifierId=${id}`, { method: "DELETE" });
    fetchGroups();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/settings"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <Settings2 className="h-7 w-7 text-purple-500" />
          <div>
            <h1 className="text-2xl font-bold">Modyfikatory</h1>
            <p className="text-sm text-muted-foreground">{groups.length} grup</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchGroups} disabled={loading}>
            <RefreshCw className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button size="sm" onClick={openCreateGroup}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nowa grupa
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {groups.map((g) => (
          <div key={g.id} className="rounded-xl border">
            <button
              type="button"
              className="flex w-full items-center justify-between p-3 text-left"
              onClick={() => toggle(g.id)}
            >
              <div className="flex items-center gap-2">
                {expanded.has(g.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <span className="font-medium">{g.name}</span>
                {g.isRequired && <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">Wymagane</span>}
                <span className="text-xs text-muted-foreground">
                  {g.modifiers.length} opcji • {g.minSelect}-{g.maxSelect} wyborów • {g._count.products} prod.
                </span>
              </div>
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditGroup(g)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteGroup(g.id)} disabled={g._count.products > 0}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </button>
            {expanded.has(g.id) && (
              <div className="border-t px-3 pb-3 pt-2 space-y-1">
                {g.modifiers.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded bg-muted/30 px-3 py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{m.name}</span>
                      {m.priceDelta !== 0 && (
                        <span className={cn("text-xs font-mono", m.priceDelta > 0 ? "text-emerald-600" : "text-red-600")}>
                          {m.priceDelta > 0 ? "+" : ""}{m.priceDelta.toFixed(2)} zł
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditModifier(g.id, m)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteModifier(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="mt-1" onClick={() => openAddModifier(g.id)}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Dodaj opcję
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Group dialog */}
      <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editGroupId ? "Edytuj grupę" : "Nowa grupa modyfikatorów"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Nazwa *</label>
              <Input value={gName} onChange={(e) => setGName(e.target.value)} placeholder="np. Stopień wysmażenia" autoFocus />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium">Min wyborów</label>
                <Input type="number" min="0" value={gMin} onChange={(e) => setGMin(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium">Max wyborów</label>
                <Input type="number" min="1" value={gMax} onChange={(e) => setGMax(e.target.value)} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={gRequired} onChange={(e) => setGRequired(e.target.checked)} className="h-4 w-4 rounded" />
              <span className="font-medium">Wymagane (kelner musi wybrać)</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupOpen(false)}>Anuluj</Button>
            <Button onClick={saveGroup} disabled={saving || !gName.trim()}>{saving ? "Zapisywanie…" : editGroupId ? "Zapisz" : "Utwórz"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modifier dialog */}
      <Dialog open={modOpen} onOpenChange={setModOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editModId ? "Edytuj opcję" : "Nowa opcja"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Nazwa *</label>
              <Input value={mName} onChange={(e) => setMName(e.target.value)} placeholder="np. Medium rare" autoFocus />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Dopłata (zł)</label>
              <Input type="number" step="0.01" value={mPrice} onChange={(e) => setMPrice(e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModOpen(false)}>Anuluj</Button>
            <Button onClick={saveModifier} disabled={saving || !mName.trim()}>{saving ? "Zapisywanie…" : editModId ? "Zapisz" : "Dodaj"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
