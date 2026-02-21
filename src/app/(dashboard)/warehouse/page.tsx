"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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
  Warehouse as WarehouseIcon,
  Package,
  ClipboardList,
  FileText,
  ClipboardCheck,
  ChefHat,
  ShoppingCart,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

type TabId = "warehouses" | "ingredients" | "stock" | "documents" | "inventory" | "recipes" | "orderlist";

const WAREHOUSE_TYPES = [
  { value: "MAIN", label: "Główny" },
  { value: "BAR", label: "Bar" },
  { value: "KITCHEN", label: "Kuchnia" },
  { value: "COLD_STORAGE", label: "Chłodnia" },
];

const MOVE_TYPES = [
  { value: "PZ", label: "PZ — Przyjęcie zewnętrzne" },
  { value: "WZ", label: "WZ — Wydanie zewnętrzne" },
  { value: "RW", label: "RW — Rozchód wewnętrzny" },
  { value: "MM", label: "MM — Przesunięcie" },
];

export default function WarehousePage() {
  const [tab, setTab] = useState<TabId>("warehouses");
  const queryClient = useQueryClient();

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const r = await fetch("/api/warehouse");
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
  });

  const { data: ingredients = [] } = useQuery({
    queryKey: ["warehouse-ingredients"],
    queryFn: async () => {
      const r = await fetch("/api/warehouse/ingredients");
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
  });

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const { data: warehouseStock } = useQuery({
    queryKey: ["warehouse-stock", selectedWarehouseId],
    queryFn: async () => {
      if (!selectedWarehouseId) return null;
      const r = await fetch(`/api/warehouse/${selectedWarehouseId}`);
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    enabled: !!selectedWarehouseId && tab === "stock",
  });

  const { data: orderList = [] } = useQuery({
    queryKey: ["warehouse-order-list"],
    queryFn: async () => {
      const r = await fetch("/api/warehouse/order-list");
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    enabled: tab === "orderlist",
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ["warehouse-recipes"],
    queryFn: async () => {
      const r = await fetch("/api/warehouse/recipes");
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    enabled: tab === "recipes",
  });

  const { data: stockMoves = [] } = useQuery({
    queryKey: ["warehouse-stock-moves", selectedWarehouseId],
    queryFn: async () => {
      const url = selectedWarehouseId
        ? `/api/warehouse/stock-moves?warehouseId=${selectedWarehouseId}&limit=50`
        : "/api/warehouse/stock-moves?limit=50";
      const r = await fetch(url);
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    enabled: tab === "documents",
  });

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "warehouses", label: "Magazyny", icon: WarehouseIcon },
    { id: "ingredients", label: "Składniki", icon: Package },
    { id: "stock", label: "Stany", icon: ClipboardList },
    { id: "documents", label: "Dokumenty", icon: FileText },
    { id: "inventory", label: "Inwentaryzacja", icon: ClipboardCheck },
    { id: "recipes", label: "Receptury", icon: ChefHat },
    { id: "orderlist", label: "Do zamówienia", icon: ShoppingCart },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Magazyn</h1>
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <Button
              key={t.id}
              variant={tab === t.id ? "default" : "outline"}
              size="sm"
              onClick={() => setTab(t.id)}
            >
              <Icon className="mr-1 h-4 w-4" />
              {t.label}
            </Button>
          );
        })}
      </div>

      {tab === "warehouses" && (
        <WarehousesSection
          warehouses={warehouses}
          onInvalidate={() => queryClient.invalidateQueries({ queryKey: ["warehouses"] })}
        />
      )}
      {tab === "ingredients" && (
        <IngredientsSection
          ingredients={ingredients}
          onInvalidate={() => queryClient.invalidateQueries({ queryKey: ["warehouse-ingredients"] })}
        />
      )}
      {tab === "stock" && (
        <StockSection
          warehouses={warehouses}
          selectedWarehouseId={selectedWarehouseId}
          onSelectWarehouse={setSelectedWarehouseId}
          warehouseStock={warehouseStock}
          onInvalidate={() => {
            queryClient.invalidateQueries({ queryKey: ["warehouse-stock", selectedWarehouseId] });
            queryClient.invalidateQueries({ queryKey: ["warehouses"] });
          }}
        />
      )}
      {tab === "documents" && (
        <DocumentsSection
          warehouses={warehouses}
          ingredients={ingredients}
          stockMoves={stockMoves}
          selectedWarehouseId={selectedWarehouseId}
          onSelectWarehouse={setSelectedWarehouseId}
          onInvalidate={() => {
            queryClient.invalidateQueries({ queryKey: ["warehouse-stock-moves"] });
            queryClient.invalidateQueries({ queryKey: ["warehouse-stock", selectedWarehouseId] });
          }}
        />
      )}
      {tab === "inventory" && (
        <InventorySection
          warehouses={warehouses}
          onInvalidate={() => queryClient.invalidateQueries({ queryKey: ["warehouses"] })}
        />
      )}
      {tab === "recipes" && (
        <RecipesSection recipes={recipes} ingredients={ingredients} onInvalidate={() => queryClient.invalidateQueries({ queryKey: ["warehouse-recipes"] })} />
      )}
      {tab === "orderlist" && <OrderListSection orderList={orderList} />}
    </div>
  );
}

function WarehousesSection({
  warehouses,
  onInvalidate,
}: {
  warehouses: Array<{ id: string; name: string; type: string; stockItemsCount: number }>;
  onInvalidate: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("MAIN");
  const [saving, setSaving] = useState(false);

  const createMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/warehouse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type }),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "Błąd");
      }
    },
    onSuccess: () => {
      onInvalidate();
      setDialogOpen(false);
      setName("");
      setType("MAIN");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      const r = await fetch(`/api/warehouse/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type }),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "Błąd");
      }
    },
    onSuccess: () => {
      onInvalidate();
      setDialogOpen(false);
      setEditingId(null);
      setName("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/warehouse/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "Błąd");
      }
    },
    onSuccess: () => onInvalidate(),
  });

  const openCreate = () => {
    setEditingId(null);
    setName("");
    setType("MAIN");
    setDialogOpen(true);
  };
  const openEdit = (w: { id: string; name: string; type: string }) => {
    setEditingId(w.id);
    setName(w.name);
    setType(w.type);
    setDialogOpen(true);
  };

  return (
    <div>
      <Button onClick={openCreate} className="mb-4">
        <Plus className="mr-2 h-4 w-4" />
        Dodaj magazyn
      </Button>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-2 text-left">Nazwa</th>
              <th className="p-2 text-left">Typ</th>
              <th className="p-2 text-left">Pozycji</th>
              <th className="p-2 text-right">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {warehouses.map((w) => (
              <tr key={w.id} className="border-b">
                <td className="p-2 font-medium">{w.name}</td>
                <td className="p-2">{WAREHOUSE_TYPES.find((t) => t.value === w.type)?.label ?? w.type}</td>
                <td className="p-2">{w.stockItemsCount}</td>
                <td className="p-2 text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(w)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => deleteMutation.mutate(w.id)}
                    disabled={w.stockItemsCount > 0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edytuj magazyn" : "Nowy magazyn"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nazwa</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="np. Główny" />
            <label className="text-sm font-medium">Typ</label>
            <select
              className="w-full rounded border p-2"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {WAREHOUSE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Anuluj
            </Button>
            <Button
              disabled={!name.trim() || saving}
              onClick={() => (editingId ? updateMutation.mutate() : createMutation.mutate())}
            >
              {editingId ? "Zapisz" : "Dodaj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IngredientsSection({
  ingredients,
  onInvalidate,
}: {
  ingredients: Array<{ id: string; name: string; unit: string; category: string | null; defaultSupplier: string | null }>;
  onInvalidate: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("szt");
  const [category, setCategory] = useState("");
  const [defaultSupplier, setDefaultSupplier] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/warehouse/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, unit, category: category || undefined, defaultSupplier: defaultSupplier || undefined }),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "Błąd");
      }
    },
    onSuccess: () => {
      onInvalidate();
      setDialogOpen(false);
      setName("");
      setUnit("szt");
      setCategory("");
      setDefaultSupplier("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      const r = await fetch(`/api/warehouse/ingredients/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, unit, category: category || null, defaultSupplier: defaultSupplier || null }),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "Błąd");
      }
    },
    onSuccess: () => {
      onInvalidate();
      setDialogOpen(false);
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/warehouse/ingredients/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "Błąd");
      }
    },
    onSuccess: () => onInvalidate(),
  });

  const openCreate = () => {
    setEditingId(null);
    setName("");
    setUnit("szt");
    setCategory("");
    setDefaultSupplier("");
    setDialogOpen(true);
  };
  const openEdit = (i: { id: string; name: string; unit: string; category: string | null; defaultSupplier: string | null }) => {
    setEditingId(i.id);
    setName(i.name);
    setUnit(i.unit);
    setCategory(i.category ?? "");
    setDefaultSupplier(i.defaultSupplier ?? "");
    setDialogOpen(true);
  };

  return (
    <div>
      <Button onClick={openCreate} className="mb-4">
        <Plus className="mr-2 h-4 w-4" />
        Dodaj składnik
      </Button>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-2 text-left">Nazwa</th>
              <th className="p-2 text-left">Jednostka</th>
              <th className="p-2 text-left">Kategoria</th>
              <th className="p-2 text-left">Dostawca</th>
              <th className="p-2 text-right">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((i) => (
              <tr key={i.id} className="border-b">
                <td className="p-2 font-medium">{i.name}</td>
                <td className="p-2">{i.unit}</td>
                <td className="p-2">{i.category ?? "—"}</td>
                <td className="p-2">{i.defaultSupplier ?? "—"}</td>
                <td className="p-2 text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(i)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMutation.mutate(i.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edytuj składnik" : "Nowy składnik"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nazwa</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="np. Schab wieprzowy" />
            <label className="text-sm font-medium">Jednostka</label>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="kg, l, szt" />
            <label className="text-sm font-medium">Kategoria (opcjonalnie)</label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="np. Mięso" />
            <label className="text-sm font-medium">Domyślny dostawca (opcjonalnie)</label>
            <Input value={defaultSupplier} onChange={(e) => setDefaultSupplier(e.target.value)} placeholder="Nazwa dostawcy" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Anuluj</Button>
            <Button disabled={!name.trim() || !unit.trim()} onClick={() => (editingId ? updateMutation.mutate() : createMutation.mutate())}>
              {editingId ? "Zapisz" : "Dodaj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StockSection({
  warehouses,
  selectedWarehouseId,
  onSelectWarehouse,
  warehouseStock,
  onInvalidate,
}: {
  warehouses: Array<{ id: string; name: string; type: string }>;
  selectedWarehouseId: string | null;
  onSelectWarehouse: (id: string | null) => void;
  warehouseStock: { stockItems: Array<{ id: string; ingredientName: string; quantity: number; unit: string; minQuantity: number; lastDeliveryPrice: number | null; status: string }> } | null;
  onInvalidate: () => void;
}) {
  const [editingMinId, setEditingMinId] = useState<string | null>(null);
  const [minVal, setMinVal] = useState("");

  const updateMinMutation = useMutation({
    mutationFn: async ({ id, minQuantity }: { id: string; minQuantity: number }) => {
      const r = await fetch(`/api/warehouse/stock-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minQuantity }),
      });
      if (!r.ok) throw new Error("Błąd");
    },
    onSuccess: () => {
      onInvalidate();
      setEditingMinId(null);
      setMinVal("");
    },
  });

  if (!warehouses.length) return <p className="text-muted-foreground">Brak magazynów. Dodaj magazyn w zakładce Magazyny.</p>;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {warehouses.map((w) => (
          <Button
            key={w.id}
            variant={selectedWarehouseId === w.id ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectWarehouse(selectedWarehouseId === w.id ? null : w.id)}
          >
            {w.name}
          </Button>
        ))}
      </div>
      {selectedWarehouseId && warehouseStock && (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-2 text-left">Składnik</th>
                <th className="p-2 text-right">Ilość</th>
                <th className="p-2 text-left">Jedn.</th>
                <th className="p-2 text-right">Min.</th>
                <th className="p-2 text-right">Cena zakupu</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {warehouseStock.stockItems.map((s) => (
                <tr key={s.id} className={cn("border-b", s.status === "OUT" && "bg-red-50 dark:bg-red-950/20", s.status === "LOW" && "bg-amber-50 dark:bg-amber-950/20")}>
                  <td className="p-2 font-medium">{s.ingredientName}</td>
                  <td className="p-2 text-right tabular-nums">{s.quantity}</td>
                  <td className="p-2">{s.unit}</td>
                  <td className="p-2 text-right">
                    {editingMinId === s.id ? (
                      <Input
                        type="number"
                        className="h-8 w-20 text-right"
                        value={minVal}
                        onChange={(e) => setMinVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") updateMinMutation.mutate({ id: s.id, minQuantity: parseFloat(minVal) || 0 });
                          if (e.key === "Escape") setEditingMinId(null);
                        }}
                      />
                    ) : (
                      <span className="tabular-nums">{s.minQuantity}</span>
                    )}
                  </td>
                  <td className="p-2 text-right">{s.lastDeliveryPrice != null ? `${s.lastDeliveryPrice.toFixed(2)} zł` : "—"}</td>
                  <td className="p-2">
                    <span className={cn(s.status === "OK" && "text-green-600", s.status === "LOW" && "text-amber-600", s.status === "OUT" && "text-red-600")}>
                      {s.status === "OK" ? "OK" : s.status === "LOW" ? "Niski" : "Brak"}
                    </span>
                  </td>
                  <td className="p-2 text-right">
                    {editingMinId === s.id ? (
                      <Button size="sm" onClick={() => updateMinMutation.mutate({ id: s.id, minQuantity: parseFloat(minVal) || 0 })}>Zapisz</Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => { setEditingMinId(s.id); setMinVal(String(s.minQuantity)); }}><Pencil className="h-4 w-4" /></Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {warehouseStock.stockItems.length === 0 && (
            <p className="p-4 text-center text-muted-foreground">Brak pozycji w tym magazynie. Dodaj przyjęcie (PZ).</p>
          )}
        </div>
      )}
    </div>
  );
}

function DocumentsSection({
  warehouses,
  ingredients,
  stockMoves,
  selectedWarehouseId,
  onSelectWarehouse,
  onInvalidate,
}: {
  warehouses: Array<{ id: string; name: string }>;
  ingredients: Array<{ id: string; name: string; unit: string }>;
  stockMoves: Array<{ id: string; type: string; documentNumber: string; warehouseFromName?: string; warehouseToName?: string; note: string | null; createdAt: string }>;
  selectedWarehouseId: string | null;
  onSelectWarehouse: (id: string | null) => void;
  onInvalidate: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [moveType, setMoveType] = useState<"PZ" | "WZ" | "RW" | "MM">("PZ");
  const [warehouseFromId, setWarehouseFromId] = useState("");
  const [warehouseToId, setWarehouseToId] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<Array<{ ingredientId: string; quantity: string; price: string; unit: string }>>([{ ingredientId: "", quantity: "", price: "", unit: "szt" }]);
  const [saving, setSaving] = useState(false);

  const addItem = () => setItems((prev) => [...prev, { ingredientId: "", quantity: "", price: "", unit: "szt" }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, f: Partial<{ ingredientId: string; quantity: string; price: string; unit: string }>) => {
    setItems((prev) => prev.map((p, i) => (i === idx ? { ...p, ...f } : p)));
  };

  const submit = async () => {
    const payload = items
      .filter((i) => i.ingredientId && i.quantity && parseFloat(i.quantity) > 0)
      .map((i) => ({
        ingredientId: i.ingredientId,
        quantity: parseFloat(i.quantity),
        unit: i.unit || "szt",
        price: moveType === "PZ" && i.price ? parseFloat(i.price) : undefined,
      }));
    if (payload.length === 0) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        type: moveType,
        items: payload,
        note: note || undefined,
      };
      if (moveType === "PZ") body.warehouseToId = warehouseToId || undefined;
      if (moveType === "WZ" || moveType === "RW") body.warehouseFromId = warehouseFromId || undefined;
      if (moveType === "MM") {
        body.warehouseFromId = warehouseFromId;
        body.warehouseToId = warehouseToId;
      }
      const r = await fetch("/api/warehouse/stock-moves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Błąd");
      onInvalidate();
      setDialogOpen(false);
      setMoveType("PZ");
      setWarehouseFromId("");
      setWarehouseToId("");
      setNote("");
      setItems([{ ingredientId: "", quantity: "", price: "", unit: "szt" }]);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Błąd");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setDialogOpen(true)}>Nowy dokument</Button>
        {warehouses.map((w) => (
          <Button
            key={w.id}
            variant={selectedWarehouseId === w.id ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectWarehouse(selectedWarehouseId === w.id ? null : w.id)}
          >
            {w.name}
          </Button>
        ))}
      </div>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-2 text-left">Numer</th>
              <th className="p-2 text-left">Typ</th>
              <th className="p-2 text-left">Z / Do</th>
              <th className="p-2 text-left">Notatka</th>
              <th className="p-2 text-left">Data</th>
            </tr>
          </thead>
          <tbody>
            {stockMoves.map((m) => (
              <tr key={m.id} className="border-b">
                <td className="p-2 font-mono text-xs">{m.documentNumber}</td>
                <td className="p-2">{MOVE_TYPES.find((t) => t.value === m.type)?.label ?? m.type}</td>
                <td className="p-2">{m.warehouseFromName ?? "—"} → {m.warehouseToName ?? "—"}</td>
                <td className="p-2">{m.note ?? "—"}</td>
                <td className="p-2">{new Date(m.createdAt).toLocaleString("pl-PL")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nowy dokument magazynowy</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Typ</label>
            <select className="w-full rounded border p-2" value={moveType} onChange={(e) => setMoveType(e.target.value as "PZ" | "WZ" | "RW" | "MM")}>
              {MOVE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {moveType === "PZ" && (
              <>
                <label className="text-sm font-medium">Magazyn docelowy</label>
                <select className="w-full rounded border p-2" value={warehouseToId} onChange={(e) => setWarehouseToId(e.target.value)}>
                  <option value="">—</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </>
            )}
            {(moveType === "WZ" || moveType === "RW") && (
              <>
                <label className="text-sm font-medium">Magazyn źródłowy</label>
                <select className="w-full rounded border p-2" value={warehouseFromId} onChange={(e) => setWarehouseFromId(e.target.value)}>
                  <option value="">—</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </>
            )}
            {moveType === "MM" && (
              <>
                <label className="text-sm font-medium">Z magazynu</label>
                <select className="w-full rounded border p-2" value={warehouseFromId} onChange={(e) => setWarehouseFromId(e.target.value)}>
                  <option value="">—</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
                <label className="text-sm font-medium">Do magazynu</label>
                <select className="w-full rounded border p-2" value={warehouseToId} onChange={(e) => setWarehouseToId(e.target.value)}>
                  <option value="">—</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </>
            )}
            <label className="text-sm font-medium">Notatka (np. dostawca)</label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opcjonalnie" />
            <label className="text-sm font-medium">Pozycje</label>
            {items.map((item, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-2 rounded border p-2">
                <select
                  className="min-w-[140px] rounded border p-1"
                  value={item.ingredientId}
                  onChange={(e) => {
                    const ing = ingredients.find((i) => i.id === e.target.value);
                    updateItem(idx, { ingredientId: e.target.value, unit: ing?.unit ?? "szt" });
                  }}
                >
                  <option value="">— składnik —</option>
                  {ingredients.map((i) => (
                    <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                  ))}
                </select>
                <Input type="number" className="w-20" placeholder="Ilość" value={item.quantity} onChange={(e) => updateItem(idx, { quantity: e.target.value })} />
                <span className="text-sm">{item.unit}</span>
                {moveType === "PZ" && <Input type="number" step="0.01" className="w-24" placeholder="Cena" value={item.price} onChange={(e) => updateItem(idx, { price: e.target.value })} />}
                <Button variant="ghost" size="sm" onClick={() => removeItem(idx)} disabled={items.length === 1}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addItem}><Plus className="mr-1 h-4 w-4" />Dodaj pozycję</Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Anuluj</Button>
            <Button disabled={saving} onClick={submit}>Utwórz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InventorySection({
  warehouses,
  onInvalidate,
}: {
  warehouses: Array<{ id: string; name: string }>;
  onInvalidate: () => void;
}) {
  const [warehouseId, setWarehouseId] = useState("");
  const { data: stock, isLoading } = useQuery({
    queryKey: ["warehouse-stock-inv", warehouseId],
    queryFn: async () => {
      if (!warehouseId) return null;
      const r = await fetch(`/api/warehouse/${warehouseId}`);
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    enabled: !!warehouseId,
  });
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const setCount = (stockItemId: string, value: string) => setCounts((prev) => ({ ...prev, [stockItemId]: value }));

  const submit = async () => {
    if (!warehouseId || !stock?.stockItems?.length) return;
    const payload = stock.stockItems.map((s: { id: string; ingredientId: string; unit: string; quantity?: number }) => ({
      stockItemId: s.id,
      ingredientId: s.ingredientId,
      countedQuantity: parseFloat(counts[s.id] ?? String(s.quantity ?? 0)) || 0,
      unit: s.unit,
    }));
    setSaving(true);
    try {
      const r = await fetch("/api/warehouse/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ warehouseId, counts: payload }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Błąd");
      onInvalidate();
      setCounts({});
      alert(`Inwentaryzacja zapisana: ${data.documentNumber}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Błąd");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Magazyn</label>
        <select className="ml-2 rounded border p-2" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
          <option value="">— wybierz —</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>
      {warehouseId && (
        <>
          {isLoading ? (
            <p className="text-muted-foreground">Ładowanie…</p>
          ) : stock?.stockItems?.length ? (
            <>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 text-left">Składnik</th>
                      <th className="p-2 text-right">Stan systemowy</th>
                      <th className="p-2 text-right">Spis z natury</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stock.stockItems.map((s: { id: string; ingredientName: string; quantity: number; unit: string }) => (
                      <tr key={s.id} className="border-b">
                        <td className="p-2 font-medium">{s.ingredientName}</td>
                        <td className="p-2 text-right tabular-nums">{s.quantity} {s.unit}</td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="any"
                            className="w-28 text-right"
                            value={counts[s.id] ?? ""}
                            onChange={(e) => setCount(s.id, e.target.value)}
                            placeholder={String(s.quantity)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button disabled={saving} onClick={submit}>Zatwierdź inwentaryzację</Button>
            </>
          ) : (
            <p className="text-muted-foreground">Brak pozycji w magazynie.</p>
          )}
        </>
      )}
    </div>
  );
}

function RecipesSection({
  recipes,
  ingredients,
  onInvalidate,
}: {
  recipes: Array<{ id: string; productId: string; productName: string; yieldQty: number; itemsCount: number }>;
  ingredients: Array<{ id: string; name: string; unit: string }>;
  onInvalidate: () => void;
}) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [addRecipeOpen, setAddRecipeOpen] = useState(false);
  const { data: products = [] } = useQuery({
    queryKey: ["products-for-recipe"],
    queryFn: async () => {
      const r = await fetch("/api/products");
      if (!r.ok) throw new Error("Błąd");
      const d = await r.json();
      return d.products ?? [];
    },
    enabled: addRecipeOpen,
  });
  const { data: recipeDetail } = useQuery({
    queryKey: ["warehouse-recipe", selectedProductId],
    queryFn: async () => {
      if (!selectedProductId) return null;
      const r = await fetch(`/api/warehouse/recipes?productId=${selectedProductId}`);
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    enabled: !!selectedProductId,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [yieldQty, setYieldQty] = useState("1");
  const [recipeItems, setRecipeItems] = useState<Array<{ ingredientId: string; quantity: string; unit: string }>>([]);
  const [saving, setSaving] = useState(false);

  const openEdit = (productId: string) => {
    setSelectedProductId(productId);
    setYieldQty("1");
    setRecipeItems([]);
    setDialogOpen(true);
  };
  useEffect(() => {
    if (dialogOpen && selectedProductId && recipeDetail?.productId === selectedProductId) {
      setYieldQty(String(recipeDetail.yieldQty ?? 1));
      setRecipeItems((recipeDetail.items ?? []).map((i: { ingredientId: string; quantity: number; unit: string }) => ({ ingredientId: i.ingredientId, quantity: String(i.quantity), unit: i.unit ?? "szt" })));
    }
  }, [dialogOpen, selectedProductId, recipeDetail]);

  const saveRecipe = async () => {
    if (!selectedProductId) return;
    const items = recipeItems.filter((i) => i.ingredientId && i.quantity && parseFloat(i.quantity) > 0).map((i) => ({
      ingredientId: i.ingredientId,
      quantity: parseFloat(i.quantity),
      unit: i.unit || "szt",
    }));
    setSaving(true);
    try {
      const r = await fetch("/api/warehouse/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedProductId, yieldQty: parseFloat(yieldQty) || 1, items }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Błąd");
      onInvalidate();
      setDialogOpen(false);
      setSelectedProductId(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Błąd");
    } finally {
      setSaving(false);
    }
  };

  const startAddRecipe = (productId: string) => {
    setSelectedProductId(productId);
    setAddRecipeOpen(false);
    setDialogOpen(true);
    setYieldQty("1");
    setRecipeItems([]);
  };

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">Receptury przypisane do produktów. Wybierz produkt, aby edytować skład (recepturę). Po zamknięciu rachunku system automatycznie odejmie składniki wg receptur.</p>
      <Button variant="outline" size="sm" onClick={() => setAddRecipeOpen(true)} className="mb-2">
        <Plus className="mr-2 h-4 w-4" />
        Dodaj recepturę do produktu
      </Button>
      <Dialog open={addRecipeOpen} onOpenChange={setAddRecipeOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Wybierz produkt</DialogTitle></DialogHeader>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {products.slice(0, 200).map((p: { id: string; name: string }) => (
              <Button key={p.id} variant="outline" className="w-full justify-start" size="sm" onClick={() => startAddRecipe(p.id)}>
                {p.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-2 text-left">Produkt</th>
              <th className="p-2 text-right">Porcje</th>
              <th className="p-2 text-right">Składników</th>
              <th className="p-2 text-right">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {recipes.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="p-2 font-medium">{r.productName}</td>
                <td className="p-2 text-right">{r.yieldQty}</td>
                <td className="p-2 text-right">{r.itemsCount}</td>
                <td className="p-2 text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(r.productId)}><Pencil className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {recipes.length === 0 && <p className="text-muted-foreground">Brak receptur. Pobierz listę produktów z API /api/products i dodaj receptury przez API POST /api/warehouse/recipes.</p>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receptura {recipeDetail?.productName ?? selectedProductId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Porcje (yield)</label>
            <Input type="number" step="0.001" value={yieldQty} onChange={(e) => setYieldQty(e.target.value)} />
            <label className="text-sm font-medium">Składniki</label>
            {recipeItems.map((item, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-2 rounded border p-2">
                <select
                  className="min-w-[140px] rounded border p-1"
                  value={item.ingredientId}
                  onChange={(e) => {
                    const ing = ingredients.find((i) => i.id === e.target.value);
                    setRecipeItems((prev) => prev.map((p, i) => (i === idx ? { ...p, ingredientId: e.target.value, unit: ing?.unit ?? "szt" } : p)));
                  }}
                >
                  <option value="">— składnik —</option>
                  {ingredients.map((i) => (
                    <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                  ))}
                </select>
                <Input type="number" step="0.001" className="w-24" placeholder="Ilość" value={item.quantity} onChange={(e) => setRecipeItems((prev) => prev.map((p, i) => (i === idx ? { ...p, quantity: e.target.value } : p)))} />
                <span className="text-sm">{item.unit}</span>
                <Button variant="ghost" size="sm" onClick={() => setRecipeItems((prev) => prev.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setRecipeItems((prev) => [...prev, { ingredientId: "", quantity: "", unit: "szt" }])}><Plus className="mr-1 h-4 w-4" />Dodaj składnik</Button>
            {recipeDetail?.foodCostPercent != null && <p className="text-sm text-muted-foreground">Food-cost (szac.): {recipeDetail.foodCostPercent.toFixed(1)}%</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Anuluj</Button>
            <Button disabled={saving} onClick={saveRecipe}>Zapisz recepturę</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderListSection({
  orderList,
}: {
  orderList: Array<{ warehouseName: string; ingredientName: string; unit: string; quantity: number; minQuantity: number; toOrder: number; defaultSupplier: string | null; lastDeliveryPrice: number | null }>;
}) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">Pozycje poniżej stanu minimalnego. Do zamówienia = min − stan.</p>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-2 text-left">Magazyn</th>
              <th className="p-2 text-left">Składnik</th>
              <th className="p-2 text-right">Stan</th>
              <th className="p-2 text-right">Min</th>
              <th className="p-2 text-right">Do zamówienia</th>
              <th className="p-2 text-left">Dostawca</th>
              <th className="p-2 text-right">Ostatnia cena</th>
            </tr>
          </thead>
          <tbody>
            {orderList.map((row, idx) => (
              <tr key={idx} className="border-b">
                <td className="p-2">{row.warehouseName}</td>
                <td className="p-2 font-medium">{row.ingredientName}</td>
                <td className="p-2 text-right tabular-nums">{row.quantity} {row.unit}</td>
                <td className="p-2 text-right tabular-nums">{row.minQuantity}</td>
                <td className="p-2 text-right font-medium tabular-nums">{row.toOrder} {row.unit}</td>
                <td className="p-2">{row.defaultSupplier ?? "—"}</td>
                <td className="p-2 text-right">{row.lastDeliveryPrice != null ? `${row.lastDeliveryPrice.toFixed(2)} zł` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {orderList.length === 0 && <p className="text-muted-foreground">Wszystkie stany powyżej minimum.</p>}
    </div>
  );
}
