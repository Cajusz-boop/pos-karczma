"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IngredientForm, type IngredientFormValue } from "@/components/receptury/IngredientForm";
import { TagPicker } from "@/components/receptury/TagPicker";
import { ArrowLeft, Plus } from "lucide-react";

const STATUSES = ["AKTYWNA", "ARCHIWALNA"] as const;

const emptyIngredient = (): IngredientFormValue => ({
  productId: null,
  productName: "",
  subRecipeId: null,
  subRecipeName: "",
  quantity: 0,
  unit: "kg",
});

export default function NowaRecepturaPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [status, setStatus] = useState("AKTYWNA");
  const [basePortions, setBasePortions] = useState(1);
  const [portionUnit, setPortionUnit] = useState("porcja");
  const [notes, setNotes] = useState("");
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [ingredients, setIngredients] = useState<IngredientFormValue[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const addIngredient = () => setIngredients((prev) => [...prev, emptyIngredient()]);
  const updateIngredient = (i: number, v: IngredientFormValue) =>
    setIngredients((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  const removeIngredient = (i: number) => setIngredients((prev) => prev.filter((_, idx) => idx !== i));

  const validIngredients = ingredients.filter(
    (i) =>
      Number(i.quantity) > 0 &&
      ((i.productId != null && i.productName) || (i.subRecipeId != null && i.subRecipeName))
  );
  const canSave = name.trim().length >= 3 && validIngredients.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await fetch("/api/receptury", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          status,
          basePortions: Math.max(0.001, basePortions),
          portionUnit: portionUnit || "porcja",
          notes: notes.trim() || null,
          tagIds,
          ingredients: validIngredients.map((i, idx) => ({
            productId: i.productId ?? undefined,
            subRecipeId: i.subRecipeId ?? undefined,
            quantity: i.quantity,
            unit: i.unit,
            sortOrder: idx,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd zapisu");
      router.push(`/receptury/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd zapisu receptury");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/receptury">
          <Button variant="ghost" size="lg" className="h-12">
            <ArrowLeft className="h-5 w-5" />
            Powrót
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Nowa receptura</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4 rounded-xl border bg-card p-4">
          <h2 className="text-lg font-semibold">Dane podstawowe</h2>
          <div className="space-y-3">
            <label className="block text-base font-medium">Nazwa receptury</label>
            <Input
              placeholder="np. Zupa pomidorowa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`h-12 text-base ${name && name.trim().length < 3 ? "border-destructive" : ""}`}
            />
            {name && name.trim().length > 0 && name.trim().length < 3 && (
              <p className="text-sm text-destructive">Min. 3 znaki</p>
            )}
            <label className="block text-base font-medium">Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <Button
                  key={s}
                  type="button"
                  variant={status === s ? "default" : "outline"}
                  size="lg"
                  className="h-12"
                  onClick={() => setStatus(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
            <TagPicker value={tagIds} onChange={setTagIds} />
            <label className="block text-base font-medium">Liczba porcji bazowych</label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                min={0.001}
                step={0.1}
                value={basePortions}
                onChange={(e) => setBasePortions(parseFloat(e.target.value) || 1)}
                className="h-12 w-32 text-base"
              />
              <Input
                placeholder="porcja"
                value={portionUnit}
                onChange={(e) => setPortionUnit(e.target.value)}
                className="h-12 w-24 text-base"
              />
            </div>
            <label className="block text-base font-medium">Notatki</label>
            <textarea
              placeholder="Uwagi, wskazówki…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base"
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-4 rounded-xl border bg-card p-4">
          <h2 className="text-lg font-semibold">Składniki</h2>
          <p className="text-sm text-muted-foreground">Wpisz min. 2 znaki, aby wyszukać produkt</p>
          <div className="space-y-3">
            {ingredients.map((ing, i) => (
              <IngredientForm
                key={i}
                ingredient={ing}
                onChange={(v) => updateIngredient(i, v)}
                onRemove={() => removeIngredient(i)}
              />
            ))}
            <Button type="button" variant="outline" size="lg" className="h-12 w-full" onClick={addIngredient}>
              <Plus className="h-5 w-5" />
              Dodaj składnik
            </Button>
          </div>
        </div>

        {error && <p className="text-destructive text-base font-medium">{error}</p>}

        <Button
          type="submit"
          size="lg"
          className="h-14 w-full text-lg bg-green-600 hover:bg-green-700"
          disabled={saving || !canSave}
        >
          {saving ? "Zapisywanie…" : "Zapisz recepturę"}
        </Button>
      </form>
    </div>
  );
}
