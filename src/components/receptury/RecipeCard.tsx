"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Tags } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_BG: Record<string, string> = {
  AKTYWNA: "bg-green-50 border-green-200",
  ARCHIWALNA: "bg-gray-50 border-gray-200",
};

export interface RecipeIngredientDisplay {
  name: string;
  quantity: number;
  unit: string;
}

export interface TagOption {
  id: number;
  name: string;
  color: string;
}

export interface RecipeCardProps {
  readOnly?: boolean;
  allTags?: TagOption[];
  recipe: {
    id: number;
    name: string;
    status: string;
    basePortions: number;
    portionUnit?: string;
    ingredientCount: number;
    isArchived?: boolean;
    tags?: { id: number; name: string; color: string }[];
    ingredients?: RecipeIngredientDisplay[];
  };
}


function formatIngredient(ing: RecipeIngredientDisplay): string {
  const q = ing.quantity % 1 === 0 ? ing.quantity.toString() : ing.quantity.toLocaleString("pl-PL", { maximumFractionDigits: 2 });
  return `${ing.name} ${q} ${ing.unit}`;
}

async function patchRecipe(id: number, data: { status?: string; tagIds?: number[] }) {
  const res = await fetch(`/api/receptury/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Błąd zapisu");
  }
  return res.json();
}

export function RecipeCard({ recipe, readOnly, allTags = [] }: RecipeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const queryClient = useQueryClient();
  const bgClass = STATUS_BG[recipe.status] ?? "bg-gray-50 border-gray-200";
  const href = `/receptury/${recipe.id}`;

  const ingredients = recipe.ingredients ?? [];
  const tagIds = (recipe.tags ?? []).map((t) => t.id);

  const toggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded((v) => !v);
  };

  const handleStatusClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (readOnly || updating) return;
    const next = recipe.status === "AKTYWNA" ? "ARCHIWALNA" : "AKTYWNA";
    setUpdating(true);
    try {
      await patchRecipe(recipe.id, { status: next });
      await queryClient.invalidateQueries({ queryKey: ["receptury"] });
    } finally {
      setUpdating(false);
    }
  };

  const handleTagToggle = async (e: React.MouseEvent, tagId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (readOnly || updating) return;
    const next = tagIds.includes(tagId) ? tagIds.filter((id) => id !== tagId) : [...tagIds, tagId];
    setUpdating(true);
    try {
      await patchRecipe(recipe.id, { tagIds: next });
      await queryClient.invalidateQueries({ queryKey: ["receptury"] });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-shadow hover:shadow-md min-h-[160px] flex flex-col",
        bgClass
      )}
    >
      <CardHeader className="pb-1 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={toggleExpanded}
            className="min-h-[44px] py-2 -my-2 -mx-1 px-1 text-left flex-1 flex items-start gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded group"
          >
            <span className="text-foreground shrink-0 mt-0.5 font-bold">
              {expanded ? <ChevronUp className="h-5 w-5 stroke-[2.5]" /> : <ChevronDown className="h-5 w-5 stroke-[2.5]" />}
            </span>
            <h3 className="text-lg font-semibold leading-tight text-foreground line-clamp-2 flex-1 min-w-0">
              {recipe.name}
            </h3>
          </button>
          {recipe.isArchived && (
            <span className="text-xs text-muted-foreground shrink-0">(archiwum)</span>
          )}
        </div>
      </CardHeader>
      {!readOnly && (
        <div className="px-4 pb-2 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={handleStatusClick}
            disabled={updating}
            className={cn(
              "min-h-[36px] px-3 rounded-lg text-sm font-semibold transition-all active:scale-95 disabled:opacity-60",
              recipe.status === "AKTYWNA"
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-300 text-gray-700 hover:bg-gray-400"
            )}
          >
            {recipe.status === "AKTYWNA" ? "AKTYWNA" : "ARCHIWALNA"}
          </button>
          {allTags.length <= 2 ? (
            allTags.map((t) => {
              const active = tagIds.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={(e) => handleTagToggle(e, t.id)}
                  disabled={updating}
                  className={cn(
                    "min-h-[36px] px-3 rounded-lg text-sm font-semibold transition-all active:scale-95 disabled:opacity-60",
                    active ? "text-white shadow-sm" : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                  )}
                  style={active ? { backgroundColor: t.color } : {}}
                >
                  {t.name}
                </button>
              );
            })
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setTagsOpen((v) => !v);
                }}
                disabled={updating}
                className="min-h-[36px] px-3 rounded-lg text-sm font-semibold flex items-center gap-1.5 bg-muted hover:bg-muted/80 text-foreground transition-all active:scale-95 disabled:opacity-60"
              >
                <Tags className="h-4 w-4" />
                Tagi
              </button>
              {tagsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    aria-hidden
                    onClick={(e) => {
                      e.stopPropagation();
                      setTagsOpen(false);
                    }}
                  />
                  <div className="absolute left-0 top-full mt-1 z-50 min-w-[200px] max-h-[220px] overflow-auto rounded-lg border bg-card shadow-lg p-2 flex flex-wrap gap-1.5">
                    {allTags.map((t) => {
                      const active = tagIds.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={(e) => handleTagToggle(e, t.id)}
                          className={cn(
                            "h-8 rounded-md px-2.5 text-xs font-medium transition-all",
                            active ? "text-white shadow-sm" : "border bg-muted/50 text-muted-foreground hover:bg-muted"
                          )}
                          style={active ? { backgroundColor: t.color, borderColor: t.color } : {}}
                        >
                          {t.name}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
      <Link href={href} className="block flex-1 flex flex-col" tabIndex={-1}>
        <CardContent className="pt-0 px-4 pb-4 mt-auto space-y-2">
          {ingredients.length > 0 && expanded && (
            <ul className="text-sm text-foreground leading-relaxed space-y-1 list-disc list-inside">
              {ingredients.map((ing, idx) => (
                <li key={idx}>{formatIngredient(ing)}</li>
              ))}
            </ul>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {recipe.tags && recipe.tags.length > 0 && (
              <>
                {recipe.tags.slice(0, 3).map((t) => (
                  <span
                    key={t.id}
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: t.color + "40", color: t.color }}
                  >
                    {t.name}
                  </span>
                ))}
                <span className="text-muted-foreground">·</span>
              </>
            )}
            <span className="text-sm text-foreground font-medium">
              {recipe.ingredientCount} {recipe.ingredientCount === 1 ? "składnik" : "składników"}
              {recipe.basePortions > 0 && ` · ${recipe.basePortions} ${recipe.portionUnit || "porcji"} baz.`}
            </span>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
