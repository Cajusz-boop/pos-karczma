"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil } from "lucide-react";
import { RecipeAutocomplete } from "@/components/receptury/RecipeAutocomplete";

interface PackageItem {
  id?: number;
  recipeDishId: number;
  portionsPerPerson: number;
  sortOrder: number;
  recipeDish?: { id: number; name: string; recipeNumber: number };
}

interface EventPackage {
  id: number;
  name: string;
  eventType: string;
  pricePerPerson: number | null;
  items: PackageItem[];
}

async function fetchPackages() {
  const res = await fetch("/api/procurement/packages?all=1");
  if (!res.ok) throw new Error("Błąd pobierania pakietów");
  return res.json() as Promise<EventPackage[]>;
}

async function createPackage(data: {
  name: string;
  eventType: string;
  pricePerPerson?: number;
  items: { recipeDishId: number; portionsPerPerson: number }[];
}) {
  const res = await fetch("/api/procurement/packages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: data.name,
      eventType: data.eventType || "INNE",
      pricePerPerson: data.pricePerPerson ?? null,
      items: data.items.map((it, i) => ({
        recipeDishId: it.recipeDishId,
        portionsPerPerson: it.portionsPerPerson ?? 1,
        sortOrder: i,
      })),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Błąd tworzenia pakietu");
  }
  return res.json();
}

async function updatePackage(
  id: number,
  data: {
    name: string;
    eventType: string;
    pricePerPerson?: number;
    items: { recipeDishId: number; portionsPerPerson: number }[];
  }
) {
  const res = await fetch(`/api/procurement/packages/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: data.name,
      eventType: data.eventType || "INNE",
      pricePerPerson: data.pricePerPerson ?? null,
      items: data.items.map((it, i) => ({
        recipeDishId: it.recipeDishId,
        portionsPerPerson: it.portionsPerPerson ?? 1,
        sortOrder: i,
      })),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Błąd aktualizacji pakietu");
  }
  return res.json();
}

const EVENT_TYPES = [
  "WESELE",
  "CHRZCINY",
  "KOMUNIA",
  "URODZINY",
  "KONFERENCJA",
  "INNE",
] as const;

export function PackagesTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formEventType, setFormEventType] = useState("INNE");
  const [formPricePerPerson, setFormPricePerPerson] = useState("");
  const [formItems, setFormItems] = useState<
    { recipeDishId: number; portionsPerPerson: number; name?: string }[]
  >([]);

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["procurement-packages"],
    queryFn: fetchPackages,
  });

  const createMut = useMutation({
    mutationFn: createPackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procurement-packages"] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updatePackage>[1] }) =>
      updatePackage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procurement-packages"] });
      setDialogOpen(false);
      setEditingId(null);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormName("");
    setFormEventType("INNE");
    setFormPricePerPerson("");
    setFormItems([]);
  };

  const openCreate = () => {
    resetForm();
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (pkg: EventPackage) => {
    setFormName(pkg.name);
    setFormEventType(pkg.eventType || "INNE");
    setFormPricePerPerson(
      pkg.pricePerPerson != null ? String(pkg.pricePerPerson) : ""
    );
    setFormItems(
      pkg.items.map((it) => ({
        recipeDishId: it.recipeDishId,
        portionsPerPerson: it.portionsPerPerson ?? 1,
        name: it.recipeDish?.name,
      }))
    );
    setEditingId(pkg.id);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formName.trim()) return;
    const items = formItems.filter((it) => it.recipeDishId > 0);
    const data = {
      name: formName.trim(),
      eventType: formEventType,
      pricePerPerson: formPricePerPerson
        ? parseFloat(formPricePerPerson)
        : undefined,
      items: items.map((it) => ({
        recipeDishId: it.recipeDishId,
        portionsPerPerson: it.portionsPerPerson ?? 1,
      })),
    };

    if (editingId) {
      updateMut.mutate({ id: editingId, data });
    } else {
      createMut.mutate(data);
    }
  };

  const addItem = () => {
    setFormItems((prev) => [
      ...prev,
      { recipeDishId: 0, portionsPerPerson: 1 },
    ]);
  };

  const updateItem = (
    idx: number,
    upd: Partial<{
      recipeDishId: number;
      portionsPerPerson: number;
      name: string;
    }>
  ) => {
    setFormItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...upd } : it))
    );
  };

  const removeItem = (idx: number) => {
    setFormItems((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">
          Zarządzaj pakietami menu i przypisuj receptury (dania) do pakietów.
        </p>
        <Button onClick={openCreate}>
          <Plus className="h-5 w-5 mr-2" />
          Dodaj pakiet
        </Button>
      </div>

      {isLoading ? (
        <div className="h-32 rounded-xl border bg-muted/30 animate-pulse" />
      ) : packages.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/30 p-12 text-center text-muted-foreground">
          Brak pakietów. Dodaj pierwszy pakiet menu.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="rounded-xl border bg-card p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{pkg.name}</h3>
                  <p className="text-sm text-muted-foreground">{pkg.eventType}</p>
                  {pkg.pricePerPerson != null && (
                    <p className="text-sm mt-1">
                      {pkg.pricePerPerson.toFixed(2)} zł / os.
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(pkg)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {pkg.items.slice(0, 5).map((it) => (
                  <li key={it.id ?? it.recipeDishId}>
                    {it.recipeDish?.name ?? `#${it.recipeDishId}`} ×{" "}
                    {it.portionsPerPerson} porcji/os.
                  </li>
                ))}
                {pkg.items.length > 5 && (
                  <li className="text-muted-foreground">
                    +{pkg.items.length - 5} pozycji
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edytuj pakiet" : "Nowy pakiet menu"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nazwa</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="np. Wesele standard"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Typ imprezy</Label>
              <select
                value={formEventType}
                onChange={(e) => setFormEventType(e.target.value)}
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Cena za osobę (zł, opcjonalnie)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formPricePerPerson}
                onChange={(e) => setFormPricePerPerson(e.target.value)}
                placeholder="np. 120"
                className="mt-1"
              />
            </div>
            <div>
              <div className="flex justify-between items-center">
                <Label>Receptury (dania) w pakiecie</Label>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Dodaj
                </Button>
              </div>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {formItems.map((it, idx) => (
                  <div
                    key={idx}
                    className="flex gap-2 items-center p-2 rounded-lg border bg-muted/30"
                  >
                    <div className="flex-1 min-w-0">
                      <RecipeAutocomplete
                        value={{
                          recipeId: it.recipeDishId || null,
                          recipeName: it.name ?? "",
                        }}
                        onChange={(r) =>
                          updateItem(idx, {
                            recipeDishId: r.recipeId,
                            name: r.recipeName,
                          })
                        }
                        placeholder="Wybierz recepturę…"
                      />
                    </div>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={it.portionsPerPerson}
                      onChange={(e) =>
                        updateItem(idx, {
                          portionsPerPerson: parseFloat(
                            e.target.value
                          ) || 1,
                        })
                      }
                      className="w-20"
                      title="Porcji na osobę"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(idx)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Anuluj
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formName.trim() ||
                formItems.filter((i) => i.recipeDishId > 0).length === 0 ||
                createMut.isPending ||
                updateMut.isPending
              }
            >
              {editingId ? "Zapisz" : "Utwórz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
