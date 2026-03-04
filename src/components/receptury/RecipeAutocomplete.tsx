"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

interface Recipe {
  id: number;
  name: string;
  portionUnit?: string;
}

interface RecipeAutocompleteProps {
  value: { recipeId: number | null; recipeName: string };
  onChange: (val: { recipeId: number; recipeName: string }) => void;
  placeholder?: string;
  excludeRecipeId?: number;
}

export function RecipeAutocomplete({
  value,
  onChange,
  placeholder = "Szukaj receptury…",
  excludeRecipeId,
}: RecipeAutocompleteProps) {
  const [search, setSearch] = useState(value.recipeName || "");
  const [results, setResults] = useState<Recipe[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (search.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      fetch(`/api/receptury?search=${encodeURIComponent(search)}`)
        .then((r) => r.json())
        .then((data: Recipe[]) => {
          setResults(excludeRecipeId ? data.filter((r) => r.id !== excludeRecipeId) : data);
          setOpen(true);
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, excludeRecipeId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const select = (r: Recipe) => {
    onChange({ recipeId: r.id, recipeName: r.name });
    setSearch(r.name);
    setOpen(false);
    setResults([]);
  };

  return (
    <div ref={wrapperRef} className="relative flex-1 min-w-[140px]">
      <Input
        placeholder={placeholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => search.length >= 2 && setOpen(true)}
        className="h-12 text-base"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-card py-1 shadow-lg">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-base hover:bg-muted"
                onClick={() => select(r)}
              >
                {r.name}
                {r.portionUnit && (
                  <span className="ml-2 text-sm text-muted-foreground">({r.portionUnit})</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      {loading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">…</span>}
    </div>
  );
}
