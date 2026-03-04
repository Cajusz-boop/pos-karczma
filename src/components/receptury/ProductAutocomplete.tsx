"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

interface Product {
  id: number;
  name: string;
  defaultUnit: string;
}

interface ProductAutocompleteProps {
  value: { productId: number | null; productName: string; unit: string };
  onChange: (val: { productId: number; productName: string; unit: string }) => void;
  placeholder?: string;
}

export function ProductAutocomplete({ value, onChange, placeholder = "Szukaj produktu…" }: ProductAutocompleteProps) {
  const [search, setSearch] = useState(value.productName || "");
  const [results, setResults] = useState<Product[]>([]);
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
      fetch(`/api/produkty?search=${encodeURIComponent(search)}`)
        .then((r) => r.json())
        .then((data: Product[]) => {
          setResults(data);
          setOpen(true);
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const select = (p: Product) => {
    onChange({ productId: p.id, productName: p.name, unit: p.defaultUnit });
    setSearch(p.name);
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
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-base hover:bg-muted"
                onClick={() => select(p)}
              >
                {p.name}
                <span className="ml-2 text-sm text-muted-foreground">({p.defaultUnit})</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {loading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">…</span>}
    </div>
  );
}
