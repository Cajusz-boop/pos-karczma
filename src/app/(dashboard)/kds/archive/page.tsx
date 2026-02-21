"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Archive, Clock, Trash2, Search } from "lucide-react";

interface ArchiveEntry {
  id: string;
  stationId: string;
  stationName: string;
  orderId: string;
  orderNumber: number;
  tableNumber: number | null;
  waiterName: string | null;
  itemCount: number;
  receivedAt: string;
  completedAt: string;
  prepTimeSeconds: number;
  prepTimeFormatted: string;
}

export default function KDSArchivePage() {
  const [stationId, setStationId] = useState("");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["kds-archive", stationId, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (stationId) params.set("stationId", stationId);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      params.set("limit", "200");
      const res = await fetch(`/api/kds/archive?${params}`);
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (days: number) => {
      const res = await fetch(`/api/kds/archive?olderThanDays=${days}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => refetch(),
  });

  const archives: ArchiveEntry[] = data?.archives ?? [];
  const stats = data?.stats ?? {};

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Archive className="w-8 h-8" />
        <h1 className="text-2xl font-bold">Archiwum KDS</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm mb-1">Stacja</label>
            <select
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              className="px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">Wszystkie</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Od</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Do</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Szukaj
          </button>
          <button
            onClick={() => {
              if (confirm("Usunąć wpisy starsze niż 30 dni?")) {
                deleteMutation.mutate(30);
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Wyczyść stare
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Zamówień</div>
          <div className="text-2xl font-bold">{stats.count ?? 0}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Śr. czas</div>
          <div className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            {stats.avgPrepTime ?? "-"}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Min. czas</div>
          <div className="text-2xl font-bold text-green-600">{stats.minPrepTime ?? "-"}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Max. czas</div>
          <div className="text-2xl font-bold text-red-600">{stats.maxPrepTime ?? "-"}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">Ładowanie...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">Nr zam.</th>
                <th className="px-4 py-3 text-left">Stacja</th>
                <th className="px-4 py-3 text-left">Stolik</th>
                <th className="px-4 py-3 text-left">Kelner</th>
                <th className="px-4 py-3 text-right">Pozycje</th>
                <th className="px-4 py-3 text-left">Otrzymano</th>
                <th className="px-4 py-3 text-left">Zakończono</th>
                <th className="px-4 py-3 text-right">Czas</th>
              </tr>
            </thead>
            <tbody>
              {archives.map((entry) => (
                <tr key={entry.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 font-medium">#{entry.orderNumber}</td>
                  <td className="px-4 py-3">{entry.stationName}</td>
                  <td className="px-4 py-3">{entry.tableNumber ?? "-"}</td>
                  <td className="px-4 py-3">{entry.waiterName ?? "-"}</td>
                  <td className="px-4 py-3 text-right">{entry.itemCount}</td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(entry.receivedAt).toLocaleString("pl-PL")}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(entry.completedAt).toLocaleString("pl-PL")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`px-2 py-1 rounded text-sm font-medium ${
                        entry.prepTimeSeconds < 300
                          ? "bg-green-100 text-green-800"
                          : entry.prepTimeSeconds < 600
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {entry.prepTimeFormatted}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isLoading && archives.length === 0 && (
          <div className="text-center py-8 text-gray-500">Brak danych dla wybranego okresu</div>
        )}
      </div>
    </div>
  );
}
