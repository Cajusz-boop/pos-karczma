"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STATUS_BG: Record<string, string> = {
  AKTYWNA: "bg-green-50 border-green-200",
  ARCHIWALNA: "bg-gray-50 border-gray-200",
};

export interface RecipeCardProps {
  recipe: {
    id: number;
    name: string;
    status: string;
    basePortions: number;
    portionUnit?: string;
    ingredientCount: number;
    isArchived?: boolean;
    tags?: { id: number; name: string; color: string }[];
  };
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const bgClass = STATUS_BG[recipe.status] ?? "bg-gray-50 border-gray-200";

  return (
    <Link href={`/receptury/${recipe.id}/edytuj`} className="block">
      <Card
        className={cn(
          "cursor-pointer transition-shadow hover:shadow-md min-h-[120px] flex flex-col",
          bgClass
        )}
      >
        <CardHeader className="pb-1 pt-4 px-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold leading-tight text-foreground line-clamp-2">
              {recipe.name}
            </h3>
            {recipe.isArchived && (
              <span className="text-xs text-muted-foreground shrink-0">(archiwum)</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-4 pb-4 mt-auto">
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
            <span className="text-sm text-muted-foreground">
              {recipe.ingredientCount} {recipe.ingredientCount === 1 ? "składnik" : "składników"}
              {recipe.basePortions > 0 && ` · ${recipe.basePortions} ${recipe.portionUnit || "porcji"} baz.`}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
