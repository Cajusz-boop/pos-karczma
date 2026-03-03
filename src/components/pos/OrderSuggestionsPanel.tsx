"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface SuggestionProduct {
  id: string;
  name: string;
  priceGross: number;
  taxRateId: string;
}

interface SuggestionGroup {
  productId: string;
  productName: string;
  suggestions: SuggestionProduct[];
}

type OrderItem = { productId: string; productName: string };

export interface OrderSuggestionsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pozycje zamówienia (do unikalnych productId + nazw i filtrowania już dodanych) */
  orderItems: OrderItem[];
  onAdd: (product: SuggestionProduct) => void;
}

export function OrderSuggestionsPanel({
  open,
  onOpenChange,
  orderItems,
  onAdd,
}: OrderSuggestionsPanelProps) {
  const [groups, setGroups] = useState<SuggestionGroup[]>([]);
  const [loading, setLoading] = useState(false);

  const uniqueBases = useMemo(() => {
    const seen = new Set<string>();
    return orderItems.filter((i) => {
      if (seen.has(i.productId)) return false;
      seen.add(i.productId);
      return true;
    });
  }, [orderItems]);

  const orderProductIds = useMemo(
    () => new Set(orderItems.map((i) => i.productId)),
    [orderItems]
  );

  const idsParam = useMemo(
    () => uniqueBases.map((b) => b.productId).join(","),
    [uniqueBases]
  );

  useEffect(() => {
    if (!open || uniqueBases.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    fetch(`/api/suggestions?productIds=${encodeURIComponent(idsParam)}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.resolve(null)))
      .then((data) => {
        if (data?.grouped && Array.isArray(data.groups)) {
          const orderIds = new Set(orderItems.map((i) => i.productId));
          const filtered = data.groups.map((g: SuggestionGroup) => ({
            ...g,
            suggestions: (g.suggestions ?? []).filter((s) => !orderIds.has(s.id)),
          })).filter((g: SuggestionGroup) => g.suggestions.length > 0);
          setGroups(filtered);
        } else {
          setGroups([]);
        }
      })
      .catch(() => setGroups([]))
      .finally(() => {
        clearTimeout(timeoutId);
        setLoading(false);
      });
  }, [open, idsParam, orderItems.length]);

  const hasAny = groups.some((g) => g.suggestions.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] flex flex-col max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Sugestie do zamówienia
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Ładowanie sugestii…
          </div>
        ) : !hasAny ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Brak sugestii dla pozycji w zamówieniu.
          </div>
        ) : (
          <div className="flex flex-col gap-4 overflow-y-auto pr-1">
            {groups.map((group) => (
              <div key={group.productId} className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Do {group.productName}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.suggestions.slice(0, 3).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2"
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
                        variant="secondary"
                        className="shrink-0 gap-1"
                        onClick={() => onAdd(s)}
                      >
                        <Plus className="h-3 w-3" />
                        Dodaj
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
