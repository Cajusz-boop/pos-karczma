"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUSES = ["AKTYWNA", "ARCHIWALNA"] as const;

interface RecipeRow {
  id: number;
  name: string;
  status: string;
  tags?: { id: number; name: string; color: string }[];
}

interface TagOption {
  id: number;
  name: string;
  color: string;
}

async function fetchAllRecipes() {
  const res = await fetch("/api/receptury?archived=1");
  if (!res.ok) throw new Error("Błąd pobierania receptur");
  return res.json() as Promise<RecipeRow[]>;
}

async function fetchTags() {
  const res = await fetch("/api/tagi");
  if (!res.ok) return [];
  return res.json() as Promise<TagOption[]>;
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

interface StatusAndTagsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StatusAndTagsModal({ open, onOpenChange }: StatusAndTagsModalProps) {
  const queryClient = useQueryClient();
  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ["receptury", "all-for-modal"],
    queryFn: fetchAllRecipes,
    enabled: open,
  });
  const { data: tags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: fetchTags,
    enabled: open,
  });

  const handleStatusChange = async (recipeId: number, status: string) => {
    try {
      await patchRecipe(recipeId, { status });
      await queryClient.invalidateQueries({ queryKey: ["receptury"] });
    } catch {
      // można dodać toast
    }
  };

  const handleTagToggle = async (recipeId: number, currentTagIds: number[], tagId: number) => {
    const next = currentTagIds.includes(tagId)
      ? currentTagIds.filter((id) => id !== tagId)
      : [...currentTagIds, tagId];
    try {
      await patchRecipe(recipeId, { tagIds: next });
      await queryClient.invalidateQueries({ queryKey: ["receptury"] });
    } catch {
      // można dodać toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Status i etykiety</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Ustaw status i tagi dla dań. Zmiany zapisują się od razu.
          </p>
        </DialogHeader>
        <div className="flex-1 overflow-auto min-h-0 -mx-2 px-2">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-muted/50 animate-pulse" />
              ))}
            </div>
          ) : recipes.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">Brak receptur.</p>
          ) : (
            <ul className="space-y-3">
              {recipes.map((r) => {
                const tagIds = (r.tags ?? []).map((t) => t.id);
                return (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3"
                  >
                    <span className="min-w-[200px] font-medium text-foreground shrink-0">
                      {r.name}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground shrink-0">Status:</span>
                      {STATUSES.map((s) => (
                        <Button
                          key={s}
                          type="button"
                          variant={r.status === s ? "default" : "outline"}
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleStatusChange(r.id, s)}
                        >
                          {s}
                        </Button>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground shrink-0">Tagi:</span>
                      {tags.map((t) => {
                        const active = tagIds.includes(t.id);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleTagToggle(r.id, tagIds, t.id)}
                            className={cn(
                              "h-8 rounded-md px-2.5 text-xs font-medium transition-all",
                              active
                                ? "text-white shadow-sm"
                                : "border bg-muted/50 text-muted-foreground hover:bg-muted"
                            )}
                            style={active ? { backgroundColor: t.color, borderColor: t.color } : {}}
                          >
                            {t.name}
                          </button>
                        );
                      })}
                      {tags.length === 0 && (
                        <span className="text-xs text-muted-foreground">Brak tagów</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
