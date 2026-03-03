"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SuggestionProduct {
  id: string;
  name: string;
  priceGross: number;
  taxRateId: string;
}

export interface SuggestionPopupProps {
  productId: string | null;
  /** Nazwa produktu do wyświetlenia w tytule (np. "Golonka pieczona") */
  productName?: string | null;
  onAdd: (product: SuggestionProduct) => void;
  onDismiss: () => void;
}

export function SuggestionPopup({
  productId,
  productName,
  onAdd,
  onDismiss,
}: SuggestionPopupProps) {
  const [suggestions, setSuggestions] = useState<SuggestionProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);

  useEffect(() => {
    if (!productId) {
      setVisible(false);
      setSuggestions([]);
      return;
    }

    setVisible(true);
    setAnimatingOut(false);
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    fetch(`/api/suggestions?productId=${encodeURIComponent(productId)}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.resolve([])))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSuggestions(
            data.map((s: { id: string; name: string; priceGross: number; taxRateId?: string }) => ({
              id: s.id,
              name: s.name,
              priceGross: s.priceGross,
              taxRateId: s.taxRateId ?? "",
            }))
          );
        } else {
          setSuggestions([]);
        }
      })
      .catch(() => setSuggestions([]))
      .finally(() => {
        clearTimeout(timeoutId);
        setLoading(false);
      });
  }, [productId]);

  const handleDismiss = useCallback(() => {
    setAnimatingOut(true);
    setTimeout(() => {
      setVisible(false);
      setSuggestions([]);
      onDismiss();
    }, 200);
  }, [onDismiss]);

  useEffect(() => {
    if (!productId || suggestions.length === 0) return;

    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [productId, suggestions.length, handleDismiss]);

  const handleAdd = useCallback(
    (product: SuggestionProduct) => {
      onAdd(product);
      handleDismiss();
    },
    [onAdd, handleDismiss]
  );

  if (!productId || !visible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transition-all duration-200",
        animatingOut
          ? "translate-y-4 opacity-0 pointer-events-none"
          : "translate-y-0 opacity-100"
      )}
    >
      <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-lg max-w-md">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-amber-500" />
            {productName?.trim() ? (
              <>Polecane do <span className="text-amber-600 dark:text-amber-400">{productName}</span></>
            ) : (
              "Polecane do Twojego zamówienia"
            )}
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Zamknij"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Ładowanie sugestii…
          </div>
        ) : suggestions.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Brak sugestii
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 3).map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {s.name}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {s.priceGross.toFixed(2)} zł
                  </span>
                </div>
                <Button
                  size="sm"
                  className="shrink-0 gap-1"
                  onClick={() => handleAdd(s)}
                >
                  <Plus className="h-3 w-3" />
                  Dodaj
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
