"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Ban,
  Check,
  RefreshCw,
  ArrowLeft,
  Search,
} from "lucide-react";
import Link from "next/link";

interface Product86 {
  id: string;
  name: string;
  categoryName: string;
  isAvailable: boolean;
}

export default function Board86Page() {
  const [unavailable, setUnavailable] = useState<Product86[]>([]);
  const [available, setAvailable] = useState<Product86[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products/86");
      const data = await res.json();
      setUnavailable(data.unavailable ?? []);
      setAvailable(data.available ?? []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const toggle86 = async (productId: string, makeAvailable: boolean) => {
    try {
      await fetch("/api/products/86", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, available: makeAvailable }),
      });
      fetchData();
    } catch { /* ignore */ }
  };

  const filteredAvailable = search
    ? available.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.categoryName.toLowerCase().includes(search.toLowerCase()))
    : available;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-800 bg-stone-950/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link href="/kitchen">
            <Button variant="ghost" size="icon" className="text-stone-400 hover:text-stone-100">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Ban className="h-7 w-7 text-red-400" />
          <div>
            <h1 className="text-xl font-bold">Tablica 86</h1>
            <p className="text-xs text-stone-400">
              {unavailable.length} niedostępnych
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-stone-700 text-stone-300 hover:bg-stone-800"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")} />
          Odśwież
        </Button>
      </header>

      <main className="p-4 space-y-6">
        {/* Unavailable (86'd) products */}
        {unavailable.length > 0 && (
          <div>
            <h2 className="mb-3 text-lg font-bold text-red-400 flex items-center gap-2">
              <Ban className="h-5 w-5" />
              Niedostępne ({unavailable.length})
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {unavailable.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle86(p.id, true)}
                  className="flex items-center justify-between rounded-xl border-2 border-red-800 bg-red-950/30 p-4 text-left transition-all active:scale-[0.98] hover:border-emerald-600"
                >
                  <div>
                    <p className="text-lg font-bold text-red-300">{p.name}</p>
                    <p className="text-sm text-stone-400">{p.categoryName}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-emerald-400">
                    <Check className="h-4 w-4" />
                    Przywróć
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {unavailable.length === 0 && (
          <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/20 p-6 text-center">
            <Check className="mx-auto mb-2 h-10 w-10 text-emerald-400" />
            <p className="text-lg font-semibold text-emerald-400">Wszystko dostępne!</p>
            <p className="text-sm text-stone-400">Żaden produkt nie jest oznaczony jako 86</p>
          </div>
        )}

        {/* Search + available products to 86 */}
        <div>
          <h2 className="mb-3 text-lg font-bold text-stone-300">Oznacz jako niedostępne</h2>
          <div className="mb-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Szukaj produktu…"
                className="bg-stone-900 border-stone-700 pl-10 text-stone-100 placeholder:text-stone-500"
              />
            </div>
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3 max-h-[50vh] overflow-y-auto">
            {filteredAvailable.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle86(p.id, false)}
                className="flex items-center justify-between rounded-lg border border-stone-800 bg-stone-900 p-3 text-left transition-all active:scale-[0.98] hover:border-red-600"
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-stone-500">{p.categoryName}</p>
                </div>
                <Ban className="h-4 w-4 text-stone-600" />
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
