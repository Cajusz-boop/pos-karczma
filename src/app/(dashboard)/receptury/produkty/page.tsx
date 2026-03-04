"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Package } from "lucide-react";
import { useState } from "react";

interface Product {
  id: number;
  name: string;
  defaultUnit: string;
  mergedIntoId: number | null;
  mergedIntoName: string | null;
  ingredientCount: number;
}

async function fetchProducts() {
  const res = await fetch("/api/produkty?limit=2000");
  if (!res.ok) throw new Error("Błąd pobierania produktów");
  return res.json() as Promise<Product[]>;
}

export default function ProduktyPage() {
  const { data: products = [], isLoading } = useQuery({ queryKey: ["produkty-list"], queryFn: fetchProducts });
  const [search, setSearch] = useState("");
  const filtered = search.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) && !p.mergedIntoId)
    : products.filter((p) => !p.mergedIntoId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/receptury">
          <Button variant="ghost" size="lg" className="h-12">
            <ArrowLeft className="h-5 w-5" />
            Powrót
          </Button>
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="h-7 w-7" />
          Słownik produktów
        </h1>
      </div>

      <p className="text-muted-foreground">
        Produkty używane w recepturach. Scalanie przez API POST /api/produkty/[id]/scal.
      </p>

      <Input
        placeholder="Szukaj produktu…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md h-12"
      />

      {isLoading ? (
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-medium">Nazwa</th>
                <th className="px-4 py-3 font-medium">Jednostka</th>
                <th className="px-4 py-3 font-medium">Użyć w recepturach</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3">{p.name}</td>
                  <td className="px-4 py-3">{p.defaultUnit}</td>
                  <td className="px-4 py-3">{p.ingredientCount}</td>
                  <td className="px-4 py-3">
                    {p.mergedIntoId ? (
                      <span className="text-muted-foreground text-sm">scalony → {p.mergedIntoName ?? "?"}</span>
                    ) : (
                      <span className="text-green-600 text-sm">aktywny</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="px-4 py-8 text-center text-muted-foreground">
              {search ? "Brak produktów spełniających kryteria" : "Brak produktów. Zaimportuj dane."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
