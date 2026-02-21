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
  FolderOpen,
  Plus,
  RefreshCw,
  ArrowLeft,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Snowflake,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  parent: { id: string; name: string } | null;
  sortOrder: number;
  color: string | null;
  icon: string | null;
  isActive: boolean;
  isSeasonal: boolean;
  seasonStart: string | null;
  seasonEnd: string | null;
  _count: { products: number; children: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState("#3b82f6");
  const [formIcon, setFormIcon] = useState("");
  const [formParentId, setFormParentId] = useState("");
  const [formSeasonal, setFormSeasonal] = useState(false);
  const [formSeasonStart, setFormSeasonStart] = useState("");
  const [formSeasonEnd, setFormSeasonEnd] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data.categories ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreate = () => {
    setEditId(null);
    setFormName("");
    setFormColor("#3b82f6");
    setFormIcon("");
    setFormParentId("");
    setFormSeasonal(false);
    setFormSeasonStart("");
    setFormSeasonEnd("");
    setEditOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditId(cat.id);
    setFormName(cat.name);
    setFormColor(cat.color ?? "#3b82f6");
    setFormIcon(cat.icon ?? "");
    setFormParentId(cat.parentId ?? "");
    setFormSeasonal(cat.isSeasonal);
    setFormSeasonStart(cat.seasonStart ? cat.seasonStart.slice(0, 10) : "");
    setFormSeasonEnd(cat.seasonEnd ? cat.seasonEnd.slice(0, 10) : "");
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        await fetch("/api/categories", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editId,
            name: formName.trim(),
            color: formColor || null,
            icon: formIcon.trim() || null,
            parentId: formParentId || null,
            isSeasonal: formSeasonal,
            seasonStart: formSeasonStart ? new Date(formSeasonStart).toISOString() : null,
            seasonEnd: formSeasonEnd ? new Date(formSeasonEnd).toISOString() : null,
          }),
        });
      } else {
        await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            color: formColor || undefined,
            icon: formIcon.trim() || undefined,
            parentId: formParentId || undefined,
            isSeasonal: formSeasonal,
            seasonStart: formSeasonStart ? new Date(formSeasonStart).toISOString() : undefined,
            seasonEnd: formSeasonEnd ? new Date(formSeasonEnd).toISOString() : undefined,
          }),
        });
      }
      setEditOpen(false);
      fetchCategories();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Czy na pewno usunąć tę kategorię?")) return;
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Błąd usuwania");
        return;
      }
      fetchCategories();
    } catch {
      // ignore
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch("/api/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      fetchCategories();
    } catch {
      // ignore
    }
  };

  const moveOrder = async (id: string, direction: "up" | "down") => {
    const idx = categories.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categories.length) return;

    const items = [
      { id: categories[idx].id, sortOrder: categories[swapIdx].sortOrder },
      { id: categories[swapIdx].id, sortOrder: categories[idx].sortOrder },
    ];

    try {
      await fetch("/api/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      fetchCategories();
    } catch {
      // ignore
    }
  };

  const topLevel = categories.filter((c) => !c.parentId);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <FolderOpen className="h-7 w-7 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold">Kategorie menu</h1>
            <p className="text-sm text-muted-foreground">{categories.length} kategorii</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchCategories} disabled={loading}>
            <RefreshCw className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nowa kategoria
          </Button>
        </div>
      </div>

      {/* Category list */}
      <div className="space-y-2">
        {topLevel.map((cat, idx) => (
          <div key={cat.id}>
            <div
              className={cn(
                "flex items-center justify-between rounded-lg border p-3",
                !cat.isActive && "opacity-50"
              )}
            >
              <div className="flex items-center gap-3">
                {cat.color && (
                  <div className="h-8 w-8 rounded-lg" style={{ backgroundColor: cat.color }} />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{cat.icon ? `${cat.icon} ` : ""}{cat.name}</p>
                    {cat.isSeasonal && (
                      <span className="flex items-center gap-0.5 rounded-full bg-cyan-100 px-1.5 py-0.5 text-xs text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
                        <Snowflake className="h-3 w-3" />
                        Sezonowe
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {cat._count.products} produktów
                    {cat._count.children > 0 && ` • ${cat._count.children} podkategorii`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveOrder(cat.id, "up")} disabled={idx === 0}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveOrder(cat.id, "down")} disabled={idx === topLevel.length - 1}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(cat.id, cat.isActive)}>
                  {cat.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(cat.id)} disabled={cat._count.products > 0 || cat._count.children > 0}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* Children */}
            {categories.filter((c) => c.parentId === cat.id).map((child) => (
              <div key={child.id} className={cn("ml-8 mt-1 flex items-center justify-between rounded-lg border p-2", !child.isActive && "opacity-50")}>
                <div className="flex items-center gap-2">
                  {child.color && <div className="h-6 w-6 rounded" style={{ backgroundColor: child.color }} />}
                  <span className="text-sm font-medium">{child.icon ? `${child.icon} ` : ""}{child.name}</span>
                  <span className="text-xs text-muted-foreground">{child._count.products} prod.</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(child)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(child.id)} disabled={child._count.products > 0}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Edit/Create dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Edytuj kategorię" : "Nowa kategoria"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Nazwa *</label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="np. Zupy" autoFocus />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium">Kolor</label>
                <div className="flex gap-2">
                  <input type="color" value={formColor} onChange={(e) => setFormColor(e.target.value)} className="h-10 w-10 cursor-pointer rounded border" />
                  <Input value={formColor} onChange={(e) => setFormColor(e.target.value)} className="flex-1" />
                </div>
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium">Ikona (emoji)</label>
                <Input value={formIcon} onChange={(e) => setFormIcon(e.target.value)} placeholder="🍲" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Kategoria nadrzędna</label>
              <select
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                value={formParentId}
                onChange={(e) => setFormParentId(e.target.value)}
              >
                <option value="">— Brak (główna) —</option>
                {categories.filter((c) => c.id !== editId && !c.parentId).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={formSeasonal} onChange={(e) => setFormSeasonal(e.target.checked)} className="h-4 w-4 rounded" />
              <Snowflake className="h-4 w-4 text-cyan-500" />
              <span className="font-medium">Kategoria sezonowa</span>
            </label>
            {formSeasonal && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium">Od</label>
                  <Input type="date" value={formSeasonStart} onChange={(e) => setFormSeasonStart(e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium">Do</label>
                  <Input type="date" value={formSeasonEnd} onChange={(e) => setFormSeasonEnd(e.target.value)} />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Anuluj</Button>
            <Button onClick={handleSave} disabled={saving || !formName.trim()}>
              {saving ? "Zapisywanie…" : editId ? "Zapisz" : "Utwórz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
