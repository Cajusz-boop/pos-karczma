"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

interface Ingredient {
  id: number;
  productName?: string | null;
  subRecipeName?: string | null;
  quantity: number;
  unit: string;
}

interface PortionCalculatorProps {
  recipe: {
    basePortions: number;
    ingredients: Ingredient[];
  };
}

/** Przelicza: ilość = Math.ceil((qty / basePortions) * guestCount * 10) / 10 */
function scaledQuantity(qty: number, basePortions: number, guestCount: number): number {
  if (basePortions <= 0) return qty;
  const scaled = (qty / basePortions) * guestCount;
  return Math.ceil(scaled * 10) / 10;
}

export function PortionCalculator({ recipe }: PortionCalculatorProps) {
  const [guestCount, setGuestCount] = useState(recipe.basePortions || 1);

  const count = Math.max(1, Math.round(guestCount));

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4">
      <h3 className="text-lg font-semibold">Kalkulator porcji</h3>
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="guest-count" className="text-base font-medium">
          Liczba gości
        </label>
        <Input
          id="guest-count"
          type="number"
          min={1}
          value={guestCount}
          onChange={(e) => setGuestCount(parseFloat(e.target.value) || 1)}
          className="h-16 w-32 text-2xl text-center"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left font-medium">Składnik</th>
              <th className="py-2 text-right font-medium">Ilość na {count} osób</th>
            </tr>
          </thead>
          <tbody>
            {recipe.ingredients.map((i) => (
              <tr key={i.id} className="border-b">
                <td className="py-2">{i.productName ?? i.subRecipeName ?? "—"}</td>
                <td className="py-2 text-right tabular-nums">
                  {scaledQuantity(i.quantity, recipe.basePortions, count).toFixed(2)} {i.unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
