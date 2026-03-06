"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, History } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface HistoryItem {
  id: number;
  changedBy: string;
  changeNote: string | null;
  snapshot: {
    name: string;
    status: string;
    ingredients?: { productName?: string; subRecipeName?: string; quantity: number; unit: string }[];
  };
  createdAt: string;
}

async function fetchHistory(recipeId: number) {
  const res = await fetch(`/api/receptury/${recipeId}/historia`);
  if (!res.ok) throw new Error("Błąd pobierania historii");
  return res.json() as Promise<HistoryItem[]>;
}

async function fetchRecipe(recipeId: number) {
  const res = await fetch(`/api/receptury/${recipeId}`);
  if (!res.ok) throw new Error("Błąd pobierania receptury");
  return res.json();
}

export default function HistoriaPageClient() {
  const params = useParams();
  const id = parseInt(String(params.id), 10);

  const { data: recipe } = useQuery({
    queryKey: ["receptury", id],
    queryFn: () => fetchRecipe(id),
    enabled: !isNaN(id),
  });

  const { data: history = [], isLoading } = useQuery({
    queryKey: ["receptury", id, "historia"],
    queryFn: () => fetchHistory(id),
    enabled: !isNaN(id),
  });

  if (isNaN(id)) return <p className="text-lg">Nieprawidłowe ID</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-wrap items-center gap-4">
        <Link href={`/receptury/${id}`}>
          <Button variant="ghost" size="lg" className="h-12">
            <ArrowLeft className="h-5 w-5" />
            Powrót
          </Button>
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="h-7 w-7" />
          Historia: {recipe?.name ?? `#${id}`}
        </h1>
      </div>

      {isLoading ? (
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      ) : history.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/30 p-12 text-center">
          <p className="text-muted-foreground">Brak zapisanych wersji. Historia powstaje przy każdej edycji receptury.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((h) => (
            <div key={h.id} className="rounded-xl border bg-card p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium">{h.snapshot.name}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(h.createdAt), "dd MMM yyyy, HH:mm", { locale: pl })} · {h.changedBy}
                </span>
              </div>
              {h.changeNote && <p className="text-sm text-muted-foreground mb-2">{h.changeNote}</p>}
              {h.snapshot.ingredients && h.snapshot.ingredients.length > 0 && (
                <ul className="text-sm text-muted-foreground space-y-1">
                  {h.snapshot.ingredients.slice(0, 5).map((ing, i) => (
                    <li key={i}>
                      {(ing.productName ?? ing.subRecipeName) ?? "?"}: {ing.quantity} {ing.unit}
                    </li>
                  ))}
                  {h.snapshot.ingredients.length > 5 && (
                    <li>… i {h.snapshot.ingredients.length - 5} pozostałych</li>
                  )}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
