"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Monitor, Trash2, ExternalLink, Volume2, VolumeX, Eye, EyeOff } from "lucide-react";

interface CustomerDisplay {
  id: string;
  name: string;
  isActive: boolean;
  showLogo: boolean;
  logoUrl: string | null;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontSize: number;
  maxOrders: number;
  showPreparingSection: boolean;
  showReadySection: boolean;
  readyTimeoutSec: number;
  soundOnReady: boolean;
  soundUrl: string | null;
}

async function fetchDisplays() {
  const res = await fetch("/api/customer-display");
  if (!res.ok) throw new Error("Błąd pobierania");
  return res.json();
}

export default function DisplaysSettingsPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<CustomerDisplay>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["customer-displays"],
    queryFn: fetchDisplays,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<CustomerDisplay>) => {
      const res = await fetch("/api/customer-display", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Błąd tworzenia");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-displays"] });
      setForm({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<CustomerDisplay> & { id: string }) => {
      const res = await fetch("/api/customer-display", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Błąd aktualizacji");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-displays"] });
      setEditingId(null);
      setForm({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/customer-display?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Błąd usuwania");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customer-displays"] }),
  });

  const displays: CustomerDisplay[] = data?.displays ?? [];

  const startEdit = (display: CustomerDisplay) => {
    setEditingId(display.id);
    setForm(display);
  };

  const handleSave = () => {
    if (editingId) {
      updateMutation.mutate({ ...form, id: editingId });
    } else if (form.name) {
      createMutation.mutate(form);
    }
  };

  if (isLoading) {
    return <div className="p-6">Ładowanie...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Monitor className="w-8 h-8" />
        <h1 className="text-2xl font-bold">Panele dla klientów (TV)</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <h2 className="font-semibold mb-4">{editingId ? "Edytuj ekran" : "Nowy ekran"}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Nazwa</label>
            <input
              type="text"
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="Ekran przy barze"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Logo URL</label>
            <input
              type="text"
              value={form.logoUrl ?? ""}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value || null })}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Kolor tła</label>
            <input
              type="color"
              value={form.backgroundColor ?? "#1a1a2e"}
              onChange={(e) => setForm({ ...form, backgroundColor: e.target.value })}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Kolor tekstu</label>
            <input
              type="color"
              value={form.textColor ?? "#ffffff"}
              onChange={(e) => setForm({ ...form, textColor: e.target.value })}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Kolor akcentu</label>
            <input
              type="color"
              value={form.accentColor ?? "#e94560"}
              onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Rozmiar czcionki (px)</label>
            <input
              type="number"
              value={form.fontSize ?? 48}
              onChange={(e) => setForm({ ...form, fontSize: parseInt(e.target.value) || 48 })}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              min={24}
              max={120}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Max zamówień</label>
            <input
              type="number"
              value={form.maxOrders ?? 10}
              onChange={(e) => setForm({ ...form, maxOrders: parseInt(e.target.value) || 10 })}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              min={1}
              max={50}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Timeout gotowych (sek)</label>
            <input
              type="number"
              value={form.readyTimeoutSec ?? 120}
              onChange={(e) => setForm({ ...form, readyTimeoutSec: parseInt(e.target.value) || 120 })}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              min={30}
              max={600}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive ?? true}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Aktywny
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.showLogo ?? true}
              onChange={(e) => setForm({ ...form, showLogo: e.target.checked })}
            />
            Pokaż logo
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.showPreparingSection ?? true}
              onChange={(e) => setForm({ ...form, showPreparingSection: e.target.checked })}
            />
            Sekcja &quot;W przygotowaniu&quot;
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.showReadySection ?? true}
              onChange={(e) => setForm({ ...form, showReadySection: e.target.checked })}
            />
            Sekcja &quot;Gotowe&quot;
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.soundOnReady ?? true}
              onChange={(e) => setForm({ ...form, soundOnReady: e.target.checked })}
            />
            Dźwięk przy gotowym
          </label>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            disabled={!form.name}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {editingId ? "Zapisz zmiany" : "Dodaj ekran"}
          </button>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setForm({});
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Anuluj
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {displays.map((display) => (
          <div
            key={display.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded flex items-center justify-center"
                style={{ backgroundColor: display.backgroundColor, color: display.textColor }}
              >
                <Monitor className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold flex items-center gap-2">
                  {display.name}
                  {display.isActive ? (
                    <Eye className="w-4 h-4 text-green-500" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                  {display.soundOnReady ? (
                    <Volume2 className="w-4 h-4 text-blue-500" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  Czcionka: {display.fontSize}px | Max: {display.maxOrders} zamówień
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`/display/${display.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded"
                title="Otwórz ekran"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
              <button
                onClick={() => startEdit(display)}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Edytuj
              </button>
              <button
                onClick={() => {
                  if (confirm(`Usunąć ekran "${display.name}"?`)) {
                    deleteMutation.mutate(display.id);
                  }
                }}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 rounded"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
        {displays.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Brak skonfigurowanych ekranów. Dodaj pierwszy powyżej.
          </div>
        )}
      </div>
    </div>
  );
}
