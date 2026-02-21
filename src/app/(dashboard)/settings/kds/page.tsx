"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Monitor,
  Save,
  RefreshCw,
  ArrowLeft,
  Volume2,
  VolumeX,
  Clock,
  Eye,
  Type,
  LayoutGrid,
  List,
  Columns,
} from "lucide-react";
import Link from "next/link";

interface KDSConfig {
  defaultMode: string;
  fontSize: string;
  soundEnabled: boolean;
  soundNewOrder: string;
  soundAlarm: string;
  warningMinutes: number;
  criticalMinutes: number;
  autoRefreshSeconds: number;
  showAllergens: boolean;
  showModifiers: boolean;
  showCourseNumber: boolean;
  darkMode: boolean;
}

interface KDSStation {
  id: string;
  name: string;
  displayOrder: number;
  categories: { category: { id: string; name: string } }[];
}

export default function KDSSettingsPage() {
  const [config, setConfig] = useState<KDSConfig | null>(null);
  const [stations, setStations] = useState<KDSStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        fetch("/api/kds/config"),
        fetch("/api/kds/stations"),
      ]);
      const cData = await cRes.json();
      const sData = await sRes.json();
      setConfig(cData.config);
      setStations(sData.stations ?? sData ?? []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const update = (key: keyof KDSConfig, value: unknown) => {
    setConfig((prev) => prev ? { ...prev, [key]: value } : prev);
    setDirty(true);
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await fetch("/api/kds/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      setDirty(false);
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  if (!config) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/settings"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <Monitor className="h-7 w-7 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold">Konfiguracja KDS</h1>
            <p className="text-sm text-muted-foreground">Progi czasowe, dźwięki, tryb wyświetlania</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!dirty || saving} className="gap-1.5">
            <Save className="h-4 w-4" />
            {saving ? "Zapisywanie…" : "Zapisz"}
          </Button>
        </div>
      </div>

      {/* Default mode */}
      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2"><LayoutGrid className="h-4 w-4" /> Tryb domyślny</h2>
        <div className="flex gap-2">
          {[
            { value: "tile", label: "Kafelkowy", icon: LayoutGrid },
            { value: "allday", label: "All-Day", icon: List },
            { value: "expo", label: "Expo", icon: Columns },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <Button
                key={m.value}
                variant={config.defaultMode === m.value ? "default" : "outline"}
                className="flex-1 gap-1.5"
                onClick={() => update("defaultMode", m.value)}
              >
                <Icon className="h-4 w-4" />
                {m.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Font size */}
      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2"><Type className="h-4 w-4" /> Rozmiar czcionki</h2>
        <div className="flex gap-2">
          {["SM", "MD", "LG", "XL"].map((size) => (
            <Button
              key={size}
              variant={config.fontSize === size ? "default" : "outline"}
              className="flex-1"
              onClick={() => update("fontSize", size)}
            >
              {size}
            </Button>
          ))}
        </div>
      </div>

      {/* Time thresholds */}
      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2"><Clock className="h-4 w-4" /> Progi czasowe</h2>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-amber-600">Ostrzeżenie (min)</label>
            <Input type="number" min="1" value={config.warningMinutes} onChange={(e) => update("warningMinutes", parseInt(e.target.value) || 10)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-red-600">Krytyczny (min)</label>
            <Input type="number" min="1" value={config.criticalMinutes} onChange={(e) => update("criticalMinutes", parseInt(e.target.value) || 20)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Auto-odświeżanie (s)</label>
            <Input type="number" min="1" value={config.autoRefreshSeconds} onChange={(e) => update("autoRefreshSeconds", parseInt(e.target.value) || 5)} />
          </div>
        </div>
      </div>

      {/* Sound */}
      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          {config.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          Dźwięki
        </h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={config.soundEnabled} onChange={(e) => update("soundEnabled", e.target.checked)} className="h-4 w-4 rounded" />
          <span>Włącz dźwięki</span>
        </label>
        {config.soundEnabled && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Nowe zamówienie</label>
              <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={config.soundNewOrder} onChange={(e) => update("soundNewOrder", e.target.value)}>
                <option value="chime">Dzwonek</option>
                <option value="bell">Dzwon</option>
                <option value="ding">Ding</option>
                <option value="notification">Powiadomienie</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Alarm (przekroczenie czasu)</label>
              <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={config.soundAlarm} onChange={(e) => update("soundAlarm", e.target.value)}>
                <option value="alarm">Alarm</option>
                <option value="siren">Syrena</option>
                <option value="beep">Beep</option>
                <option value="urgent">Pilne</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Display options */}
      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2"><Eye className="h-4 w-4" /> Wyświetlanie</h2>
        <div className="space-y-2">
          {[
            { key: "showAllergens" as const, label: "Pokaż alergeny" },
            { key: "showModifiers" as const, label: "Pokaż modyfikatory" },
            { key: "showCourseNumber" as const, label: "Pokaż numer kursu" },
            { key: "darkMode" as const, label: "Ciemny motyw" },
          ].map((opt) => (
            <label key={opt.key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={config[opt.key]} onChange={(e) => update(opt.key, e.target.checked)} className="h-4 w-4 rounded" />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Stations info */}
      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="text-sm font-semibold">Stacje KDS ({stations.length})</h2>
        <div className="space-y-1">
          {stations.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded bg-muted/30 px-3 py-2 text-sm">
              <span className="font-medium">{s.name}</span>
              <span className="text-xs text-muted-foreground">
                {s.categories.map((c) => c.category.name).join(", ") || "Wszystkie kategorie"}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Stacje KDS zarządzane są w sekcji drukarek i kategorii.
        </p>
      </div>
    </div>
  );
}
