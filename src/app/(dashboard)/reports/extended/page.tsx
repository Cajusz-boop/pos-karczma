"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Table2, TrendingUp } from "lucide-react";

export default function ExtendedReportsPage() {
  const [activeTab, setActiveTab] = useState<"tables" | "shift">("tables");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-8 h-8" />
        <h1 className="text-2xl font-bold">Raporty rozszerzone</h1>
      </div>

      <div className="flex gap-4 mb-6">
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
      </div>

      <div className="flex gap-2 mb-6 border-b pb-2">
        <button
          onClick={() => setActiveTab("tables")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t ${
            activeTab === "tables"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200"
          }`}
        >
          <Table2 className="w-4 h-4" />
          Raport stolików
        </button>
        <button
          onClick={() => setActiveTab("shift")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t ${
            activeTab === "shift"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Raport zmiany
        </button>
      </div>

      {activeTab === "tables" && <TablesReport from={dateFrom} to={dateTo} />}
      {activeTab === "shift" && <ShiftReport from={dateFrom} to={dateTo} />}
    </div>
  );
}

function TablesReport({ from, to }: { from: string; to: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["report-tables", from, to],
    queryFn: async () => {
      const res = await fetch(`/api/reports/tables?from=${from}&to=${to}`);
      return res.json();
    },
  });

  if (isLoading) return <div>Ładowanie raportu...</div>;

  const tables = data?.tables ?? [];
  const summary = data?.summary ?? {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Stoliki" value={summary.tableCount ?? 0} />
        <StatCard label="Zamówienia" value={summary.totalOrders ?? 0} />
        <StatCard label="Goście" value={summary.totalGuests ?? 0} />
        <StatCard label="Suma" value={`${(summary.grandTotal ?? 0).toFixed(2)} zł`} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Śr. na stolik" value={`${(summary.avgPerTable ?? 0).toFixed(2)} zł`} />
        <StatCard label="Śr. na zamówienie" value={`${(summary.avgPerOrder ?? 0).toFixed(2)} zł`} />
        <StatCard label="Śr. na gościa" value={`${(summary.avgPerGuest ?? 0).toFixed(2)} zł`} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">Stolik</th>
              <th className="px-4 py-3 text-left">Sala</th>
              <th className="px-4 py-3 text-right">Zamówienia</th>
              <th className="px-4 py-3 text-right">Goście</th>
              <th className="px-4 py-3 text-right">Sprzedaż</th>
              <th className="px-4 py-3 text-right">Śr./zam.</th>
              <th className="px-4 py-3 text-right">Śr./gość</th>
            </tr>
          </thead>
          <tbody>
            {tables.map((table: {
              tableId: string;
              tableNumber: number;
              roomName: string;
              orderCount: number;
              guestCount: number;
              totalSales: number;
              avgPerOrder: number;
              avgPerGuest: number;
            }) => (
              <tr key={table.tableId} className="border-t hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3 font-medium">#{table.tableNumber}</td>
                <td className="px-4 py-3">{table.roomName}</td>
                <td className="px-4 py-3 text-right">{table.orderCount}</td>
                <td className="px-4 py-3 text-right">{table.guestCount}</td>
                <td className="px-4 py-3 text-right font-medium">{table.totalSales.toFixed(2)} zł</td>
                <td className="px-4 py-3 text-right">{table.avgPerOrder.toFixed(2)} zł</td>
                <td className="px-4 py-3 text-right">{table.avgPerGuest.toFixed(2)} zł</td>
              </tr>
            ))}
          </tbody>
        </table>
        {tables.length === 0 && (
          <div className="text-center py-8 text-gray-500">Brak danych dla wybranego okresu</div>
        )}
      </div>
    </div>
  );
}

function ShiftReport({ from, to }: { from: string; to: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["report-shift", from, to],
    queryFn: async () => {
      const res = await fetch(`/api/reports/shift-extended?from=${from}&to=${to}`);
      return res.json();
    },
  });

  if (isLoading) return <div>Ładowanie raportu...</div>;

  const summary = data?.summary ?? {};
  const byCategory = data?.byCategory ?? [];
  const byPayment = data?.byPayment ?? [];
  const byProduct = data?.byProduct ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Sprzedaż" value={`${(summary.totalSales ?? 0).toFixed(2)} zł`} highlight />
        <StatCard label="Zamówienia" value={summary.totalOrders ?? 0} />
        <StatCard label="Goście" value={summary.totalGuests ?? 0} />
        <StatCard label="Śr./zamówienie" value={`${(summary.avgPerOrder ?? 0).toFixed(2)} zł`} />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Paragony" value={summary.receiptCount ?? 0} />
        <StatCard label="Faktury" value={summary.invoiceCount ?? 0} />
        <StatCard label="Puste rachunki" value={summary.emptyOrderCount ?? 0} />
        <StatCard label="Anulowane poz." value={summary.cancelledItemCount ?? 0} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="font-semibold mb-3">Według kategorii</h3>
          <div className="space-y-2 max-h-64 overflow-auto">
            {byCategory.map((cat: { categoryId: string; name: string; quantity: number; total: number }) => (
              <div key={cat.categoryId} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <span>{cat.name}</span>
                <span className="font-medium">{cat.total.toFixed(2)} zł</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="font-semibold mb-3">Według płatności</h3>
          <div className="space-y-2">
            {byPayment.map((pay: { method: string; count: number; total: number }) => (
              <div key={pay.method} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <span>{pay.method}</span>
                <div className="text-right">
                  <div className="font-medium">{pay.total.toFixed(2)} zł</div>
                  <div className="text-xs text-gray-500">{pay.count} transakcji</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="font-semibold mb-3">Top 20 produktów</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-2 text-left">Produkt</th>
              <th className="px-3 py-2 text-left">Kategoria</th>
              <th className="px-3 py-2 text-right">Ilość</th>
              <th className="px-3 py-2 text-right">Wartość</th>
            </tr>
          </thead>
          <tbody>
            {byProduct.slice(0, 20).map((prod: { productId: string; name: string; category: string; quantity: number; total: number }) => (
              <tr key={prod.productId} className="border-t">
                <td className="px-3 py-2">{prod.name}</td>
                <td className="px-3 py-2 text-gray-500">{prod.category}</td>
                <td className="px-3 py-2 text-right">{prod.quantity}</td>
                <td className="px-3 py-2 text-right font-medium">{prod.total.toFixed(2)} zł</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data?.discounts && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Rabaty</h3>
          <div className="flex gap-8">
            <div>
              <span className="text-gray-500">Ilość:</span>{" "}
              <span className="font-medium">{data.discounts.count}</span>
            </div>
            <div>
              <span className="text-gray-500">Suma:</span>{" "}
              <span className="font-medium">{data.discounts.total.toFixed(2)} zł</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-lg ${highlight ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 shadow"}`}>
      <div className={`text-sm ${highlight ? "text-blue-100" : "text-gray-500"}`}>{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
