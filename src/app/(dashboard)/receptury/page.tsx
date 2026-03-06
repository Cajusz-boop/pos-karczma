"use client";

export const dynamic = "force-dynamic";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RecipeCard } from "@/components/receptury/RecipeCard";
import { StatusAndTagsModal } from "@/components/receptury/StatusAndTagsModal";
import { Plus, Search, Tags, Link2, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const CHEF_LOGIN_LINK = "https://pos.karczma-labedz.pl/login?redirect=/receptury";

interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
}

interface RecipeListItem {
  id: number;
  name: string;
  status: string;
  basePortions: number;
  portionUnit?: string;
  ingredientCount: number;
  isArchived?: boolean;
  tags?: { id: number; name: string; color: string }[];
  ingredients?: RecipeIngredient[];
}

async function fetchRecipes(params: { status?: string; tag?: string; search?: string; archived?: string }) {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.tag) sp.set("tag", params.tag);
  if (params.search?.trim()) sp.set("search", params.search.trim());
  if (params.archived === "1") sp.set("archived", "1");
  const res = await fetch(`/api/receptury?${sp}`);
  if (!res.ok) throw new Error("Błąd pobierania receptur");
  return res.json() as Promise<RecipeListItem[]>;
}

async function fetchTags() {
  const res = await fetch("/api/tagi");
  if (!res.ok) return [];
  return res.json() as Promise<{ id: number; name: string; color: string; recipeCount: number }[]>;
}

const STATUSES = ["AKTYWNA", "ARCHIWALNA"] as const;

export default function RecepturyPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterTagId, setFilterTagId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [statusTagsModalOpen, setStatusTagsModalOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const copyChefLink = () => {
    void navigator.clipboard.writeText(CHEF_LOGIN_LINK).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const { data: tags = [] } = useQuery({ queryKey: ["tags"], queryFn: fetchTags });

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ["receptury", filterStatus, filterTagId, search, showArchived],
    queryFn: () =>
      fetchRecipes({
        status: filterStatus || undefined,
        tag: filterTagId || undefined,
        search,
        archived: showArchived ? "1" : undefined,
      }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Receptury</h1>
        <div className="flex gap-2">
          {currentUser && (
            <Button
              variant="outline"
              size="lg"
              className="h-12"
              onClick={() => setStatusTagsModalOpen(true)}
            >
              <Tags className="h-5 w-5" />
              Status i etykiety
            </Button>
          )}
          <Link href="/receptury/produkty">
            <Button variant="outline" size="lg" className="h-12">
              Produkty
            </Button>
          </Link>
          <Link href="/receptury/tagi">
            <Button variant="outline" size="lg" className="h-12">
              Tagi
            </Button>
          </Link>
          {currentUser && (
            <Link href="/receptury/nowa">
              <Button size="lg" className="h-12 min-w-[200px] text-base">
                <Plus className="h-5 w-5" />
                Dodaj recepturę
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-muted/40 px-4 py-3 flex flex-wrap items-center gap-2">
        <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground">Link do logowania dla szefa kuchni:</span>
        <a
          href={CHEF_LOGIN_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-primary hover:underline break-all"
        >
          {CHEF_LOGIN_LINK}
        </a>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 shrink-0"
          onClick={copyChefLink}
        >
          {linkCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          <span className="sr-only">{linkCopied ? "Skopiowano" : "Kopiuj link"}</span>
        </Button>
      </div>

      <StatusAndTagsModal open={statusTagsModalOpen} onOpenChange={setStatusTagsModalOpen} />

      {/* Filtry statusu */}
      <div className="space-y-3">
        <p className="text-base font-medium text-foreground">Status</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterStatus === "" ? "default" : "outline"}
            size="lg"
            className="h-12 min-w-[100px] text-base"
            onClick={() => setFilterStatus("")}
          >
            Wszystkie
          </Button>
          {STATUSES.map((s) => (
            <Button
              key={s}
              variant={filterStatus === s ? "default" : "outline"}
              size="lg"
              className="h-12 min-w-[100px] text-base"
              onClick={() => setFilterStatus(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Filtry tagów — kafelki jak kategorie w POS */}
      <div className="space-y-3">
        <p className="text-base font-medium text-foreground">Tagi</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilterTagId("")}
            className={cn(
              "shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all active:scale-95",
              filterTagId === ""
                ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/50"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            Wszystkie
          </button>
          {tags.map((t) => {
            const isActive = filterTagId === String(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilterTagId(isActive ? "" : String(t.id))}
                className={cn(
                  "shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all active:scale-95 hover:shadow-md",
                  isActive && "ring-2 ring-white/50 shadow-md"
                )}
                style={{ backgroundColor: t.color }}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Wyszukiwarka */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Szukaj po nazwie dania…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 pl-10 text-base"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-base">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="h-5 w-5"
          />
          Pokaż archiwalne
        </label>
      </div>

      {/* Lista kart */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl border bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/30 p-12 text-center">
          <p className="text-lg text-muted-foreground">
            {search || filterStatus || filterTagId
              ? "Brak receptur spełniających kryteria."
              : "Brak receptur. Dodaj pierwszą recepturę lub zaimportuj dane."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => (
            <RecipeCard
              key={r.id}
              readOnly={!currentUser}
              allTags={tags}
              recipe={{
                id: r.id,
                name: r.name,
                status: r.status ?? "AKTYWNA",
                basePortions: r.basePortions ?? 1,
                portionUnit: r.portionUnit,
                ingredientCount: r.ingredientCount,
                isArchived: r.isArchived,
                tags: r.tags ?? [],
                ingredients: r.ingredients ?? [],
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
