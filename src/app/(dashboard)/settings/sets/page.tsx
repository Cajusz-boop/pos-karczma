"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, Edit2, Package, Layers, Save, X, ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";

type SuperGroup = {
  id: string;
  number: number;
  name: string;
  categoryIds: string[];
  categoryNames: string[];
  isActive: boolean;
  productCount: number;
};

type Category = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  priceGross: number;
  isSet: boolean;
  productType: string;
  superGroupId: string | null;
  category: { id: string; name: string };
};

type SetComponent = {
  id: string;
  componentId: string;
  componentName: string;
  componentPrice: number;
  isRequired: boolean;
  isDefault: boolean;
  priceDelta: number;
  sortOrder: number;
};

export default function SetsSettingsPage() {
  const [activeTab, setActiveTab] = useState<"supergroups" | "sets">("supergroups");
  const [editingSuperGroup, setEditingSuperGroup] = useState<SuperGroup | null>(null);
  const [newSuperGroup, setNewSuperGroup] = useState({ number: 1, name: "", categoryIds: [] as string[] });
  const [expandedSet, setExpandedSet] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: superGroupsData } = useQuery({
    queryKey: ["super-groups"],
    queryFn: () => fetch("/api/super-groups").then((r) => r.json()),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories-all"],
    queryFn: () => fetch("/api/categories").then((r) => r.json()),
  });

  const { data: productsData } = useQuery({
    queryKey: ["products-sets"],
    queryFn: () => fetch("/api/products?all=true").then((r) => r.json()),
  });

  const superGroups: SuperGroup[] = superGroupsData?.superGroups ?? [];
  const categories: Category[] = categoriesData?.categories ?? [];
  const products: Product[] = productsData?.products ?? [];
  const sets = products.filter((p) => p.isSet || p.productType === "SET");

  const createSuperGroupMutation = useMutation({
    mutationFn: (data: typeof newSuperGroup) =>
      fetch("/api/super-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-groups"] });
      setNewSuperGroup({ number: 1, name: "", categoryIds: [] });
    },
  });

  const updateSuperGroupMutation = useMutation({
    mutationFn: (data: Partial<SuperGroup> & { id: string }) =>
      fetch("/api/super-groups", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-groups"] });
      setEditingSuperGroup(null);
    },
  });

  const deleteSuperGroupMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/super-groups?id=${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["super-groups"] }),
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center gap-4">
          <Link href="/settings" className="p-2 hover:bg-gray-700 rounded">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-semibold">Zestawy i Nadgrupy</h1>
        </div>
      </header>

      <div className="p-4">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("supergroups")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeTab === "supergroups" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            <Layers className="w-4 h-4" />
            Nadgrupy towarowe
          </button>
          <button
            onClick={() => setActiveTab("sets")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeTab === "sets" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            <Package className="w-4 h-4" />
            Zestawy
          </button>
        </div>

        {activeTab === "supergroups" && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-medium mb-4">Dodaj nadgrupę</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Numer (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newSuperGroup.number}
                    onChange={(e) => setNewSuperGroup((s) => ({ ...s, number: parseInt(e.target.value) || 1 }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Nazwa</label>
                  <input
                    type="text"
                    value={newSuperGroup.name}
                    onChange={(e) => setNewSuperGroup((s) => ({ ...s, name: e.target.value }))}
                    placeholder="np. Dodatki do pizzy"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => createSuperGroupMutation.mutate(newSuperGroup)}
                    disabled={!newSuperGroup.name || createSuperGroupMutation.isPending}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Dodaj
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm text-gray-400 mb-2">Kategorie (gdzie można dodawać te dodatki)</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-1 bg-gray-700 px-2 py-1 rounded text-sm">
                      <input
                        type="checkbox"
                        checked={newSuperGroup.categoryIds.includes(cat.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewSuperGroup((s) => ({ ...s, categoryIds: [...s.categoryIds, cat.id] }));
                          } else {
                            setNewSuperGroup((s) => ({ ...s, categoryIds: s.categoryIds.filter((c) => c !== cat.id) }));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      {cat.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Nazwa</th>
                    <th className="px-4 py-3 text-left">Kategorie</th>
                    <th className="px-4 py-3 text-center">Produkty</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {superGroups.map((sg) => (
                    <tr key={sg.id} className="hover:bg-gray-750">
                      {editingSuperGroup?.id === sg.id ? (
                        <>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={editingSuperGroup.number}
                              onChange={(e) =>
                                setEditingSuperGroup((s) => s && { ...s, number: parseInt(e.target.value) || 1 })
                              }
                              className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={editingSuperGroup.name}
                              onChange={(e) => setEditingSuperGroup((s) => s && { ...s, name: e.target.value })}
                              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {categories.slice(0, 5).map((cat) => (
                                <label key={cat.id} className="flex items-center gap-1 text-xs">
                                  <input
                                    type="checkbox"
                                    checked={editingSuperGroup.categoryIds.includes(cat.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setEditingSuperGroup((s) =>
                                          s && { ...s, categoryIds: [...s.categoryIds, cat.id] }
                                        );
                                      } else {
                                        setEditingSuperGroup((s) =>
                                          s && { ...s, categoryIds: s.categoryIds.filter((c) => c !== cat.id) }
                                        );
                                      }
                                    }}
                                  />
                                  {cat.name}
                                </label>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">{sg.productCount}</td>
                          <td className="px-4 py-3 text-center">
                            <label className="flex items-center justify-center gap-1">
                              <input
                                type="checkbox"
                                checked={editingSuperGroup.isActive}
                                onChange={(e) =>
                                  setEditingSuperGroup((s) => s && { ...s, isActive: e.target.checked })
                                }
                              />
                            </label>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => updateSuperGroupMutation.mutate(editingSuperGroup)}
                                className="p-1 hover:bg-green-600 rounded"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button onClick={() => setEditingSuperGroup(null)} className="p-1 hover:bg-gray-600 rounded">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-mono">{sg.number}</td>
                          <td className="px-4 py-3 font-medium">{sg.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-400">{sg.categoryNames.join(", ") || "Wszystkie"}</td>
                          <td className="px-4 py-3 text-center">{sg.productCount}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded text-xs ${sg.isActive ? "bg-green-600" : "bg-gray-600"}`}>
                              {sg.isActive ? "Aktywna" : "Nieaktywna"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setEditingSuperGroup(sg)} className="p-1 hover:bg-gray-600 rounded">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Usunąć nadgrupę?")) deleteSuperGroupMutation.mutate(sg.id);
                                }}
                                className="p-1 hover:bg-red-600 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {superGroups.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        Brak nadgrup. Dodaj pierwszą powyżej.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "sets" && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-medium mb-2">Zestawy ({sets.length})</h2>
              <p className="text-sm text-gray-400 mb-4">
                Zestawy to produkty typu SET. Edytuj produkt i ustaw &quot;Typ produktu&quot; na &quot;Zestaw&quot; aby go tu zobaczyć.
              </p>

              <div className="space-y-2">
                {sets.map((set) => (
                  <SetItem key={set.id} set={set} expanded={expandedSet === set.id} onToggle={() => setExpandedSet(expandedSet === set.id ? null : set.id)} />
                ))}
                {sets.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    Brak zestawów. Ustaw typ produktu na &quot;SET&quot; w edycji produktu.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SetItem({ set, expanded, onToggle }: { set: Product; expanded: boolean; onToggle: () => void }) {
  const queryClient = useQueryClient();
  const [addingComponent, setAddingComponent] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");

  const { data: componentsData } = useQuery({
    queryKey: ["set-components", set.id],
    queryFn: () => fetch(`/api/products/${set.id}/components`).then((r) => r.json()),
    enabled: expanded,
  });

  const { data: productsData } = useQuery({
    queryKey: ["products-for-components"],
    queryFn: () => fetch("/api/products?all=true").then((r) => r.json()),
    enabled: addingComponent,
  });

  const components: SetComponent[] = componentsData?.components ?? [];
  const availableProducts: Product[] = productsData?.products ?? [];

  const addComponentMutation = useMutation({
    mutationFn: (productId: string) =>
      fetch(`/api/products/${set.id}/components`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentId: productId }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["set-components", set.id] });
      setAddingComponent(false);
      setSelectedProductId("");
    },
  });

  const removeComponentMutation = useMutation({
    mutationFn: (componentId: string) =>
      fetch(`/api/products/${set.id}/components?componentId=${componentId}`, {
        method: "DELETE",
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["set-components", set.id] }),
  });

  return (
    <div className="bg-gray-700 rounded-lg overflow-hidden">
      <button onClick={onToggle} className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-650">
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <Package className="w-5 h-5 text-blue-400" />
          <span className="font-medium">{set.name}</span>
          <span className="text-sm text-gray-400">({set.category.name})</span>
        </div>
        <span className="text-green-400">{Number(set.priceGross).toFixed(2)} zł</span>
      </button>

      {expanded && (
        <div className="border-t border-gray-600 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-300">Składniki zestawu</h4>
            <button
              onClick={() => setAddingComponent(true)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Dodaj składnik
            </button>
          </div>

          {addingComponent && (
            <div className="bg-gray-800 p-3 rounded mb-3 flex gap-2">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2"
              >
                <option value="">Wybierz produkt...</option>
                {availableProducts
                  .filter((p) => p.id !== set.id && !components.some((c) => c.componentId === p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({Number(p.priceGross).toFixed(2)} zł)
                    </option>
                  ))}
              </select>
              <button
                onClick={() => addComponentMutation.mutate(selectedProductId)}
                disabled={!selectedProductId || addComponentMutation.isPending}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded"
              >
                Dodaj
              </button>
              <button onClick={() => setAddingComponent(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded">
                Anuluj
              </button>
            </div>
          )}

          <div className="space-y-2">
            {components.map((comp) => (
              <div key={comp.id} className="flex items-center justify-between bg-gray-800 px-3 py-2 rounded">
                <div className="flex items-center gap-3">
                  <span className={comp.isRequired ? "text-red-400" : "text-gray-300"}>{comp.componentName}</span>
                  {comp.isRequired && <span className="text-xs bg-red-600 px-1 rounded">Wymagany</span>}
                  {comp.isDefault && <span className="text-xs bg-blue-600 px-1 rounded">Domyślny</span>}
                </div>
                <div className="flex items-center gap-3">
                  {comp.priceDelta > 0 && <span className="text-green-400">+{comp.priceDelta.toFixed(2)} zł</span>}
                  <button
                    onClick={() => {
                      if (confirm("Usunąć składnik z zestawu?")) removeComponentMutation.mutate(comp.componentId);
                    }}
                    className="p-1 hover:bg-red-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {components.length === 0 && (
              <div className="text-center text-gray-500 py-4">Brak składników. Dodaj składniki do zestawu.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
