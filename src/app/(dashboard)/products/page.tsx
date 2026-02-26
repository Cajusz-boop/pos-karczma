"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAllProducts } from "@/hooks/useProducts";
import { useAllCategories } from "@/hooks/useCategories";
import { useTaxRates } from "@/hooks/useTaxRates";
import { useState, useMemo } from "react";
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
  Plus,
  Pencil,
  Trash2,
  Search,
  Eye,
  EyeOff,
  Check,
  X,
  Package,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────── */

interface CategoryFlat {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  color: string | null;
  icon: string | null;
}

interface TaxRate {
  id: string;
  name: string;
  ratePercent: number;
  fiscalSymbol: string;
  isDefault: boolean;
}

interface ProductRow {
  id: string;
  name: string;
  nameShort: string | null;
  categoryId: string;
  category: { id: string; name: string };
  priceGross: number;
  taxRateId: string;
  taxRate: { id: string; fiscalSymbol: string };
  isActive: boolean;
  isAvailable: boolean;
  color: string | null;
  imageUrl: string | null;
  sortOrder: number;
}

/* ─── Main Page ──────────────────────────────────────────────────────── */

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [showInactive, setShowInactive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formNameShort, setFormNameShort] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formTaxRateId, setFormTaxRateId] = useState("");
  const [formPriceGross, setFormPriceGross] = useState("");
  const [formColor, setFormColor] = useState("");
  const [formSortOrder, setFormSortOrder] = useState("0");

  const { products: productsRaw, isLoading: productsLoading } = useAllProducts();
  const { categories: categoriesRaw } = useAllCategories();
  const { taxRates: taxRatesRaw } = useTaxRates();

  const catMap = useMemo(() => new Map(categoriesRaw.map((c) => [c.id, c])), [categoriesRaw]);
  const taxMap = useMemo(() => new Map(taxRatesRaw.map((t) => [t.id, t])), [taxRatesRaw]);

  const products: ProductRow[] = useMemo(
    () =>
      productsRaw.map((p) => ({
        id: p.id,
        name: p.name,
        nameShort: p.nameShort ?? null,
        categoryId: p.categoryId,
        category: { id: p.categoryId, name: catMap.get(p.categoryId)?.name ?? "" },
        priceGross: p.priceGross,
        taxRateId: p.taxRateId,
        taxRate: { id: p.taxRateId, fiscalSymbol: taxMap.get(p.taxRateId)?.fiscalSymbol ?? "?" },
        isActive: p.isActive,
        isAvailable: p.isAvailable,
        color: p.color ?? null,
        imageUrl: p.imageUrl ?? null,
        sortOrder: p.sortOrder,
      })),
    [productsRaw, catMap, taxMap]
  );
  const categories: CategoryFlat[] = categoriesRaw.map((c) => ({
    id: c.id,
    name: c.name,
    parentId: c.parentId ?? null,
    sortOrder: c.sortOrder,
    color: c.color ?? null,
    icon: c.icon ?? null,
  }));
  const taxRates: TaxRate[] = taxRatesRaw;

  const filteredProducts = useMemo(() => {
    let list = products;
    if (!showInactive) {
      list = list.filter((p) => p.isActive);
    }
    if (filterCategory) {
      list = list.filter((p) => p.categoryId === filterCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.nameShort && p.nameShort.toLowerCase().includes(q))
      );
    }
    return list;
  }, [products, showInactive, filterCategory, search]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const body = {
        name: formName,
        nameShort: formNameShort || undefined,
        categoryId: formCategoryId,
        taxRateId: formTaxRateId,
        priceGross: parseFloat(formPriceGross) || 0,
        color: formColor || undefined,
        sortOrder: parseInt(formSortOrder) || 0,
      };
      const r = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "Błąd tworzenia produktu");
      }
      return r.json();
    },
    onSuccess: () => {
      invalidate();
      closeDialog();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingProduct) return;
      const body: Record<string, unknown> = {};
      if (formName !== editingProduct.name) body.name = formName;
      if ((formNameShort || null) !== editingProduct.nameShort)
        body.nameShort = formNameShort || null;
      if (formCategoryId !== editingProduct.categoryId) body.categoryId = formCategoryId;
      if (formTaxRateId !== editingProduct.taxRateId) body.taxRateId = formTaxRateId;
      const price = parseFloat(formPriceGross) || 0;
      if (price !== editingProduct.priceGross) body.priceGross = price;
      if ((formColor || null) !== editingProduct.color) body.color = formColor || null;
      const sort = parseInt(formSortOrder) || 0;
      if (sort !== editingProduct.sortOrder) body.sortOrder = sort;

      if (Object.keys(body).length === 0) return;

      const r = await fetch(`/api/products/${editingProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "Błąd aktualizacji");
      }
      return r.json();
    },
    onSuccess: () => {
      invalidate();
      closeDialog();
    },
  });

  // Toggle availability
  const toggleAvailability = useMutation({
    mutationFn: async ({ id, isAvailable }: { id: string; isAvailable: boolean }) => {
      const r = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable }),
      });
      if (!r.ok) throw new Error("Błąd");
    },
    onSuccess: invalidate,
  });

  // Soft delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "Błąd");
      }
    },
    onSuccess: invalidate,
  });

  // Restore (set isActive=true)
  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      if (!r.ok) throw new Error("Błąd");
    },
    onSuccess: invalidate,
  });

  const openCreate = () => {
    setEditingProduct(null);
    setFormName("");
    setFormNameShort("");
    setFormCategoryId(categories[0]?.id ?? "");
    setFormTaxRateId(taxRates.find((t) => t.isDefault)?.id ?? taxRates[0]?.id ?? "");
    setFormPriceGross("");
    setFormColor("");
    setFormSortOrder("0");
    setDialogOpen(true);
  };

  const openEdit = (p: ProductRow) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormNameShort(p.nameShort ?? "");
    setFormCategoryId(p.categoryId);
    setFormTaxRateId(p.taxRateId);
    setFormPriceGross(String(p.priceGross));
    setFormColor(p.color ?? "");
    setFormSortOrder(String(p.sortOrder));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = () => {
    if (editingProduct) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const isFormValid = formName.trim().length > 0 && formCategoryId && formTaxRateId && formPriceGross;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Produkty</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nowy produkt
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj produktu…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="relative">
          <select
            className="h-9 rounded-md border bg-background px-3 pr-8 text-sm"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">Wszystkie kategorie</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.parentId ? "  └ " : ""}{c.name}
              </option>
            ))}
          </select>
        </div>
        <Button
          variant={showInactive ? "default" : "outline"}
          size="sm"
          onClick={() => setShowInactive(!showInactive)}
        >
          {showInactive ? <Eye className="mr-1 h-4 w-4" /> : <EyeOff className="mr-1 h-4 w-4" />}
          {showInactive ? "Pokaż nieaktywne" : "Ukryj nieaktywne"}
        </Button>
        <span className="text-sm text-muted-foreground">
          {filteredProducts.length} {filteredProducts.length === 1 ? "produkt" : "produktów"}
        </span>
      </div>

      {/* Products table */}
      {productsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Package className="mb-2 h-10 w-10" />
          <p>Brak produktów{search ? " pasujących do wyszukiwania" : ""}</p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-2 text-left font-medium">Nazwa</th>
                <th className="p-2 text-left font-medium hidden sm:table-cell">Nazwa skrócona</th>
                <th className="p-2 text-left font-medium">Kategoria</th>
                <th className="p-2 text-right font-medium">Cena brutto</th>
                <th className="p-2 text-center font-medium">VAT</th>
                <th className="p-2 text-center font-medium">Dostępny</th>
                {showInactive && <th className="p-2 text-center font-medium">Aktywny</th>}
                <th className="p-2 text-center font-medium hidden md:table-cell">Kolejność</th>
                <th className="p-2 text-right font-medium">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr
                  key={p.id}
                  className={cn(
                    "border-b transition-colors hover:bg-muted/30",
                    !p.isActive && "opacity-50",
                    !p.isAvailable && p.isActive && "bg-amber-50/50 dark:bg-amber-950/10"
                  )}
                >
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      {p.color && (
                        <span
                          className="inline-block h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                      )}
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-2 text-muted-foreground hidden sm:table-cell">
                    {p.nameShort ?? "—"}
                  </td>
                  <td className="p-2">{p.category.name}</td>
                  <td className="p-2 text-right tabular-nums font-medium">
                    {p.priceGross.toFixed(2)} zł
                  </td>
                  <td className="p-2 text-center">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-bold">
                      {p.taxRate.fiscalSymbol}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-7 w-7 p-0",
                        p.isAvailable ? "text-green-600" : "text-red-500"
                      )}
                      onClick={() =>
                        toggleAvailability.mutate({
                          id: p.id,
                          isAvailable: !p.isAvailable,
                        })
                      }
                      title={p.isAvailable ? "Dostępny — kliknij aby wyłączyć" : "Niedostępny — kliknij aby włączyć"}
                    >
                      {p.isAvailable ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </td>
                  {showInactive && (
                    <td className="p-2 text-center">
                      {p.isActive ? (
                        <span className="text-green-600 text-xs font-medium">Tak</span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => restoreMutation.mutate(p.id)}
                        >
                          Przywróć
                        </Button>
                      )}
                    </td>
                  )}
                  <td className="p-2 text-center tabular-nums hidden md:table-cell">
                    {p.sortOrder}
                  </td>
                  <td className="p-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => openEdit(p)}
                        title="Edytuj"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {p.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm(`Czy na pewno chcesz dezaktywować "${p.name}"?`)) {
                              deleteMutation.mutate(p.id);
                            }
                          }}
                          title="Dezaktywuj"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? `Edytuj: ${editingProduct.name}` : "Nowy produkt"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">
                Nazwa <span className="text-destructive">*</span>
              </label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="np. Żurek w chlebie"
                maxLength={100}
              />
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formName.length}/100 znaków
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Nazwa skrócona (paragon, max 40 zn.)</label>
              <Input
                value={formNameShort}
                onChange={(e) => setFormNameShort(e.target.value)}
                placeholder="np. Żurek/chleb"
                maxLength={40}
              />
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formNameShort.length}/40 znaków (Posnet limit)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">
                  Kategoria <span className="text-destructive">*</span>
                </label>
                <select
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                >
                  <option value="">— wybierz —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.parentId ? "  └ " : ""}{c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">
                  Stawka VAT <span className="text-destructive">*</span>
                </label>
                <select
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={formTaxRateId}
                  onChange={(e) => setFormTaxRateId(e.target.value)}
                >
                  <option value="">— wybierz —</option>
                  {taxRates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fiscalSymbol} — {t.name} ({t.ratePercent}%)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium">
                  Cena brutto (zł) <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formPriceGross}
                  onChange={(e) => setFormPriceGross(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Kolor</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={formColor || "#3b82f6"}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="h-9 w-12 cursor-pointer p-1"
                  />
                  <Input
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    placeholder="#hex"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Kolejność</label>
                <Input
                  type="number"
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Anuluj
            </Button>
            <Button
              disabled={
                !isFormValid ||
                createMutation.isPending ||
                updateMutation.isPending
              }
              onClick={handleSubmit}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Zapisywanie…"
                : editingProduct
                ? "Zapisz zmiany"
                : "Dodaj produkt"}
            </Button>
          </DialogFooter>
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-destructive">
              {(createMutation.error ?? updateMutation.error)?.message ?? "Wystąpił błąd"}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
