"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductAutocomplete } from "./ProductAutocomplete";
import { RecipeAutocomplete } from "./RecipeAutocomplete";
import { X } from "lucide-react";

const UNITS = ["kg", "g", "l", "ml", "litr", "dag", "szt", "op", "porcja"] as const;

export interface IngredientFormValue {
  productId: number | null;
  productName: string;
  subRecipeId: number | null;
  subRecipeName: string;
  quantity: number;
  unit: string;
  /** tryb wyboru: produkt lub receptura (pod-receptura) */
  _mode?: "product" | "recipe";
}

interface IngredientFormProps {
  ingredient: IngredientFormValue;
  onChange: (ingredient: IngredientFormValue) => void;
  onRemove: () => void;
  /** ID receptury edytowanej (do wykluczenia z listy pod-receptur, uniknięcie cykli) */
  excludeRecipeId?: number;
}

export function IngredientForm({ ingredient, onChange, onRemove, excludeRecipeId }: IngredientFormProps) {
  const unit = UNITS.includes(ingredient.unit as (typeof UNITS)[number]) ? ingredient.unit : "kg";
  const isSubRecipe =
    ingredient._mode === "recipe" || (ingredient.subRecipeId != null && ingredient.subRecipeName.length > 0);

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <div className="flex gap-1 shrink-0">
        <Button
          type="button"
          variant={!isSubRecipe ? "default" : "outline"}
          size="sm"
          className="h-12"
          onClick={() =>
            onChange({
              ...ingredient,
              productId: null,
              productName: "",
              subRecipeId: null,
              subRecipeName: "",
              _mode: "product",
            })
          }
        >
          Produkt
        </Button>
        <Button
          type="button"
          variant={isSubRecipe ? "default" : "outline"}
          size="sm"
          className="h-12"
          onClick={() =>
            onChange({
              ...ingredient,
              productId: null,
              productName: "",
              subRecipeId: null,
              subRecipeName: "",
              _mode: "recipe",
            })
          }
        >
          Receptura
        </Button>
      </div>
      {!isSubRecipe ? (
        <ProductAutocomplete
          value={{
            productId: ingredient.productId,
            productName: ingredient.productName,
            unit: ingredient.unit,
          }}
          onChange={(v) =>
            onChange({
              ...ingredient,
              productId: v.productId,
              productName: v.productName,
              unit: v.unit,
              subRecipeId: null,
              subRecipeName: "",
              _mode: "product",
            })
          }
        />
      ) : (
        <RecipeAutocomplete
          value={{ recipeId: ingredient.subRecipeId, recipeName: ingredient.subRecipeName }}
          onChange={(v) =>
            onChange({
              ...ingredient,
              subRecipeId: v.recipeId,
              subRecipeName: v.recipeName,
              productId: null,
              productName: "",
              _mode: "recipe",
            })
          }
          excludeRecipeId={excludeRecipeId}
        />
      )}
      <Input
        type="number"
        placeholder="Ilość"
        min={0}
        step={0.01}
        value={ingredient.quantity || ""}
        onChange={(e) => onChange({ ...ingredient, quantity: parseFloat(e.target.value) || 0 })}
        className="w-28 h-12 text-base"
      />
      <div className="flex flex-wrap gap-1">
        {UNITS.map((u) => (
          <Button
            key={u}
            type="button"
            variant={unit === u ? "default" : "outline"}
            size="sm"
            className="h-12 min-w-[44px] text-sm"
            onClick={() => onChange({ ...ingredient, unit: u })}
          >
            {u}
          </Button>
        ))}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-12 w-12 shrink-0 text-destructive hover:text-destructive"
        onClick={onRemove}
        title="Usuń składnik"
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
}
