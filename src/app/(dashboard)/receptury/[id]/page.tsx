"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PortionCalculator } from "@/components/receptury/PortionCalculator";
import { ArrowLeft, Pencil, Archive, History } from "lucide-react";
import { useState } from "react";


async function fetchRecipe(id: number) {
  const res = await fetch(`/api/receptury/${id}`);
  if (!res.ok) throw new Error("Błąd pobierania receptury");
  return res.json();
}

export default function RecepturaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(String(params.id), 10);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const { data: recipe, isLoading } = useQuery({
    queryKey: ["receptury", id],
    queryFn: () => fetchRecipe(id),
    enabled: !isNaN(id),
  });

  const handleArchive = async () => {
    if (isNaN(id)) return;
    setArchiving(true);
    try {
      const res = await fetch(`/api/receptury/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Błąd archiwizacji");
      setArchiveOpen(false);
      router.push("/receptury");
    } catch {
      setArchiving(false);
    }
  };

  if (isNaN(id)) return <p className="text-lg text-muted-foreground">Nieprawidłowe ID</p>;
  if (isLoading) return <div className="h-32 animate-pulse rounded-xl bg-muted" />;
  if (!recipe) return <p className="text-lg text-muted-foreground">Receptura nie znaleziona</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/receptury">
          <Button variant="ghost" size="lg" className="h-12">
            <ArrowLeft className="h-5 w-5" />
            Powrót do listy
          </Button>
        </Link>
        <div className="flex-1" />
        <Link href={`/receptury/${id}/edytuj`}>
          <Button size="lg" className="h-12">
            <Pencil className="h-5 w-5" />
            Edytuj
          </Button>
        </Link>
        <Link href={`/receptury/${id}/historia`}>
          <Button variant="outline" size="lg" className="h-12">
            <History className="h-5 w-5" />
            Historia
          </Button>
        </Link>
        {!recipe.isArchived && (
          <Button
            variant="outline"
            size="lg"
            className="h-12"
            onClick={() => setArchiveOpen(true)}
          >
            <Archive className="h-5 w-5" />
            Archiwizuj
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{recipe.name}</h1>
        <p className="text-base text-muted-foreground">
          {recipe.status ?? "AKTYWNA"}
          {recipe.basePortions > 0 && ` · ${recipe.basePortions} ${recipe.portionUnit ?? "porcji"} bazowych`}
        </p>
      </div>

      {recipe.notes && (
        <div className="rounded-xl border bg-card p-4">
          <h2 className="text-lg font-semibold mb-2">Notatki</h2>
          <p className="text-base text-muted-foreground whitespace-pre-wrap">{recipe.notes}</p>
        </div>
      )}

      <PortionCalculator
        recipe={{
          basePortions: recipe.basePortions,
          ingredients: recipe.ingredients,
        }}
      />

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Czy na pewno ukryć tę recepturę?</DialogTitle>
          </DialogHeader>
          <p className="text-base text-muted-foreground">
            Receptura zostanie przeniesiona do archiwum. Możesz ją później przywrócić.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveOpen(false)}>
              Anuluj
            </Button>
            <Button variant="destructive" onClick={handleArchive} disabled={archiving}>
              {archiving ? "Archiwizuję…" : "Archiwizuj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
