"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Tag, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagItem {
  id: number;
  name: string;
  color: string;
  recipeCount: number;
}

async function fetchTags() {
  const res = await fetch("/api/tagi");
  if (!res.ok) throw new Error("Błąd pobierania tagów");
  return res.json() as Promise<TagItem[]>;
}

export default function TagiPage() {
  const queryClient = useQueryClient();
  const { data: tags = [], isLoading } = useQuery({ queryKey: ["tags"], queryFn: fetchTags });

  const [addName, setAddName] = useState("");
  const [addColor, setAddColor] = useState("#6B7280");
  const [editOpen, setEditOpen] = useState(false);
  const [editTag, setEditTag] = useState<TagItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#6B7280");
  const [deleteConfirm, setDeleteConfirm] = useState<TagItem | null>(null);

  const createMutation = useMutation({
    mutationFn: async (body: { name: string; color: string }) => {
      const res = await fetch("/api/tagi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Błąd tworzenia tagu");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setAddName("");
      setAddColor("#6B7280");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, color }: { id: number; name: string; color: string }) => {
      const res = await fetch(`/api/tagi/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });
      if (!res.ok) throw new Error("Błąd aktualizacji");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setEditOpen(false);
      setEditTag(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/tagi/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Błąd usuwania");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setDeleteConfirm(null);
    },
  });

  const handleAdd = () => {
    const name = addName.trim();
    if (!name) return;
    createMutation.mutate({ name, color: addColor.slice(0, 7) });
  };

  const openEdit = (t: TagItem) => {
    setEditTag(t);
    setEditName(t.name);
    setEditColor(t.color);
    setEditOpen(true);
  };

  const handleEditSave = () => {
    if (!editTag || !editName.trim()) return;
    updateMutation.mutate({
      id: editTag.id,
      name: editName.trim(),
      color: editColor.slice(0, 7),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/receptury">
          <Button variant="ghost" size="lg" className="h-12">
            <ArrowLeft className="h-5 w-5" />
            Powrót
          </Button>
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Tag className="h-7 w-7" />
          Tagi receptur
        </h1>
      </div>

      <p className="text-muted-foreground">
        Tagi służą do kategoryzacji receptur (np. obiady, wegetariańskie). Dodaj tag i przypisz go do receptur w edycji dania.
      </p>

      {/* Formularz dodawania */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <h2 className="font-semibold text-foreground">Dodaj tag</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Nazwa</label>
            <Input
              placeholder="np. Wegetariańskie"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              className="w-48"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Kolor</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={addColor}
                onChange={(e) => setAddColor(e.target.value)}
                className="h-10 w-12 rounded border cursor-pointer"
              />
              <Input
                value={addColor}
                onChange={(e) => setAddColor(e.target.value)}
                className="w-24 font-mono text-sm"
              />
            </div>
          </div>
          <Button
            onClick={handleAdd}
            disabled={!addName.trim() || createMutation.isPending}
            className="gap-2"
          >
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Dodaj tag
          </Button>
        </div>
        {createMutation.isError && (
          <p className="text-sm text-destructive">{createMutation.error.message}</p>
        )}
      </div>

      {/* Lista tagów — kafelki jak kategorie w POS */}
      {isLoading ? (
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      ) : (
        <div className="space-y-3">
          <p className="text-base font-medium text-foreground">Twoje tagi</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <div
                key={t.id}
                className={cn(
                  "shrink-0 rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all",
                  "flex items-center gap-2"
                )}
                style={{ backgroundColor: t.color }}
              >
                <span>{t.name}</span>
                <span className="opacity-90 text-xs font-normal">({t.recipeCount})</span>
                <div className="ml-1 flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(t)}
                    className="p-1 rounded hover:bg-white/20 transition-colors"
                    title="Edytuj"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(t)}
                    className="p-1 rounded hover:bg-white/20 transition-colors"
                    title="Usuń"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {tags.length === 0 && (
              <p className="py-4 text-muted-foreground">
                Brak tagów. Użyj formularza powyżej, aby dodać pierwszy tag.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Dialog edycji */}
      <Dialog open={editOpen} onOpenChange={(open) => !open && setEditOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edytuj tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nazwa</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nazwa tagu"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Kolor</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="h-10 w-12 rounded border cursor-pointer"
                />
                <Input
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="w-24 font-mono text-sm"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Anuluj
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={!editName.trim() || updateMutation.isPending}
              className="gap-2"
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Zapisz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Potwierdzenie usunięcia */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usuń tag</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Czy na pewno chcesz usunąć tag &quot;{deleteConfirm?.name}&quot;? Zostanie on odłączony od wszystkich receptur.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Anuluj
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
              disabled={deleteMutation.isPending}
              className="gap-2"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Usuń
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
