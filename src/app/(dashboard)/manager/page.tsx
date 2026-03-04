"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Settings,
  Archive,
  Hash,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ManagerPage() {
  const [activeTab, setActiveTab] = useState<"counter" | "cleanup" | "backup" | "fiscalize" | "cache">("counter");

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-8 h-8" />
        <h1 className="text-2xl font-bold">Funkcje menadżera</h1>
      </div>

      <div className="flex gap-2 mb-6 border-b pb-2">
        {[
          { id: "counter", label: "Numerator", icon: Hash },
          { id: "cleanup", label: "Usuwanie", icon: Trash2 },
          { id: "backup", label: "Kopie zapasowe", icon: Archive },
          { id: "fiscalize", label: "Fiskalizacja", icon: CheckCircle },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "counter" && <OrderCounterSection />}
      {activeTab === "cleanup" && <CleanupSection />}
      {activeTab === "backup" && <BackupSection />}
      {activeTab === "fiscalize" && <FiscalizeSection />}
      {activeTab === "cache" && <CacheSection />}
    </div>
  );
}

function CacheSection() {
  const [resetting, setResetting] = useState(false);
  const handleResetCache = async () => {
    if (!confirm("Resetować cache offline? Wszystkie dane lokalne (produkty, zamówienia pending) zostaną usunięte. Aplikacja się przeładuje.")) return;
    setResetting(true);
    try {
      const Dexie = (await import("dexie")).default;
      await Dexie.delete("PosKarczma");
      window.location.reload();
    } catch (e) {
      console.error("Reset cache failed:", e);
      alert("Błąd resetowania cache");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Database className="w-5 h-5" />
        Cache offline (Dexie / IndexedDB)
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        W razie problemów (uszkodzone dane, błędy synchronizacji) możesz wyczyścić lokalną bazę. Dane z serwera zostaną pobrane ponownie po przeładowaniu.
      </p>
      <Button variant="destructive" onClick={handleResetCache} disabled={resetting}>
        {resetting ? "Resetowanie…" : "Resetuj cache offline"}
      </Button>
    </div>
  );
}

function OrderCounterSection() {
  const [startFrom, setStartFrom] = useState(0);
  const [maxNumber, setMaxNumber] = useState(9999);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["order-counter"],
    queryFn: async () => {
      const res = await fetch("/api/manager/order-counter");
      return res.json();
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/manager/order-counter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startFrom, confirm: true }),
      });
      return res.json();
    },
    onSuccess: () => refetch(),
  });

  const setMaxMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/manager/order-counter", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxNumber }),
      });
      return res.json();
    },
    onSuccess: () => refetch(),
  });

  if (isLoading) return <div>Ładowanie...</div>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Numerator zamówień</h2>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
          <div className="text-sm text-gray-500 mb-1">Aktualny numer</div>
          <div className="text-3xl font-bold">{data?.currentNumber ?? 0}</div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
          <div className="text-sm text-gray-500 mb-1">Wykorzystanie</div>
          <div className="text-3xl font-bold">{data?.percentUsed ?? 0}%</div>
          <div className="text-sm text-gray-500">z {data?.maxNumber}</div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
          <div className="text-sm text-gray-500 mb-1">Dzisiaj zamówień</div>
          <div className="text-3xl font-bold">{data?.todayCount ?? 0}</div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
          <div className="text-sm text-gray-500 mb-1">Ostatnie zamówienie</div>
          <div className="text-lg">
            {data?.lastOrderDate
              ? new Date(data.lastOrderDate).toLocaleString("pl-PL")
              : "Brak"}
          </div>
        </div>
      </div>

      <div className="border-t pt-4 space-y-4">
        <div>
          <label className="block text-sm mb-1">Resetuj numerator od</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={startFrom}
              onChange={(e) => setStartFrom(parseInt(e.target.value) || 0)}
              className="w-32 px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              min={0}
            />
            <button
              onClick={() => {
                if (confirm(`Zresetować numerator? Następne zamówienie: ${startFrom + 1}`)) {
                  resetMutation.mutate();
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Resetuj
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Maksymalny numer</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={maxNumber}
              onChange={(e) => setMaxNumber(parseInt(e.target.value) || 9999)}
              className="w-32 px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              min={100}
            />
            <button
              onClick={() => setMaxMutation.mutate()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Ustaw max
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CleanupSection() {
  const [days, setDays] = useState(90);
  const [keepFiscalized, setKeepFiscalized] = useState(true);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["cleanup-preview", days],
    queryFn: async () => {
      const res = await fetch(`/api/manager/cleanup-orders?days=${days}`);
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/manager/cleanup-orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ olderThanDays: days, confirm: true, keepFiscalized }),
      });
      return res.json();
    },
    onSuccess: () => refetch(),
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Usuwanie starych rachunków</h2>

      <div className="flex gap-4 mb-4">
        <div>
          <label className="block text-sm mb-1">Starsze niż (dni)</label>
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value) || 90)}
            className="w-32 px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            min={30}
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 pb-2">
            <input
              type="checkbox"
              checked={keepFiscalized}
              onChange={(e) => setKeepFiscalized(e.target.checked)}
            />
            Zachowaj zafiskalizowane
          </label>
        </div>
      </div>

      {isLoading ? (
        <div>Sprawdzanie...</div>
      ) : (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded mb-4">
          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">Do usunięcia: {data?.count ?? 0} zamówień</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Data graniczna: {data?.criteria?.cutoffDate ? new Date(data.criteria.cutoffDate).toLocaleDateString("pl-PL") : "-"}
          </div>
        </div>
      )}

      <button
        onClick={() => {
          if (confirm(`UWAGA: Usuniesz ${data?.count ?? 0} zamówień. Ta operacja jest nieodwracalna!`)) {
            deleteMutation.mutate();
          }
        }}
        disabled={!data?.count}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4 inline mr-2" />
        Usuń stare rachunki
      </button>
    </div>
  );
}

function BackupSection() {
  const [backupName, setBackupName] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["config-backups"],
    queryFn: async () => {
      const res = await fetch("/api/manager/config-backup");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/manager/config-backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: backupName || undefined }),
      });
      return res.json();
    },
    onSuccess: () => {
      refetch();
      setBackupName("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/manager/config-backup?id=${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => refetch(),
  });

  const backups = data?.backups ?? [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Kopie zapasowe konfiguracji</h2>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={backupName}
          onChange={(e) => setBackupName(e.target.value)}
          placeholder="Nazwa kopii (opcjonalna)"
          className="flex-1 px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
        />
        <button
          onClick={() => createMutation.mutate()}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          <Archive className="w-4 h-4 inline mr-2" />
          Utwórz kopię
        </button>
      </div>

      {isLoading ? (
        <div>Ładowanie...</div>
      ) : (
        <div className="space-y-2">
          {backups.map((backup: { id: string; name: string; createdAt: string; tableCount: number }) => (
            <div
              key={backup.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded"
            >
              <div>
                <div className="font-medium">{backup.name}</div>
                <div className="text-sm text-gray-500">
                  {new Date(backup.createdAt).toLocaleString("pl-PL")} | {backup.tableCount} stolików
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={`/api/manager/config-backup?id=${backup.id}`}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-600 rounded"
                  download
                >
                  <Download className="w-5 h-5" />
                </a>
                <button
                  onClick={() => {
                    if (confirm(`Usunąć kopię "${backup.name}"?`)) {
                      deleteMutation.mutate(backup.id);
                    }
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-600 rounded"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          {backups.length === 0 && (
            <div className="text-center py-4 text-gray-500">Brak kopii zapasowych</div>
          )}
        </div>
      )}
    </div>
  );
}

function FiscalizeSection() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["fiscalize-pending"],
    queryFn: async () => {
      const res = await fetch("/api/manager/fiscalize-batch");
      return res.json();
    },
  });

  const fiscalizeMutation = useMutation({
    mutationFn: async (orderIds: string[]) => {
      const res = await fetch("/api/manager/fiscalize-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds }),
      });
      return res.json();
    },
    onSuccess: () => refetch(),
  });

  const orders = data?.orders ?? [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Fiskalizacja zbiorcza</h2>

      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-2xl font-bold">{data?.pendingCount ?? 0}</span>
          <span className="text-gray-500 ml-2">zamówień do fiskalizacji</span>
        </div>
        <div className="text-lg">
          Suma: <span className="font-bold">{(data?.totalAmount ?? 0).toFixed(2)} zł</span>
        </div>
      </div>

      {isLoading ? (
        <div>Ładowanie...</div>
      ) : orders.length > 0 ? (
        <>
          <div className="max-h-64 overflow-auto border rounded mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">Nr</th>
                  <th className="px-3 py-2 text-left">Typ</th>
                  <th className="px-3 py-2 text-left">Stolik</th>
                  <th className="px-3 py-2 text-right">Kwota</th>
                  <th className="px-3 py-2 text-left">Data</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: { id: string; orderNumber: number; type: string; tableNumber?: number; total: number; createdAt: string }) => (
                  <tr key={order.id} className="border-t">
                    <td className="px-3 py-2">{order.orderNumber}</td>
                    <td className="px-3 py-2">{order.type}</td>
                    <td className="px-3 py-2">{order.tableNumber ?? "-"}</td>
                    <td className="px-3 py-2 text-right">{order.total.toFixed(2)} zł</td>
                    <td className="px-3 py-2">
                      {new Date(order.createdAt).toLocaleDateString("pl-PL")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={() => {
              if (confirm(`Zafiskalizować ${orders.length} zamówień?`)) {
                fiscalizeMutation.mutate(orders.map((o: { id: string }) => o.id));
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 inline mr-2" />
            Zafiskalizuj wszystkie
          </button>
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
          Wszystkie zamówienia zafiskalizowane
        </div>
      )}
    </div>
  );
}
