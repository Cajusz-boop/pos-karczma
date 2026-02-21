"use client";

import { useState, useRef, useEffect } from "react";
import { Filter, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EU_ALLERGENS: { code: string; name: string }[] = [
  { code: "GLUTEN", name: "Gluten" },
  { code: "EGGS", name: "Jaja" },
  { code: "MILK", name: "Mleko" },
  { code: "FISH", name: "Ryby" },
  { code: "CRUSTACEANS", name: "Skorupiaki" },
  { code: "PEANUTS", name: "Orzechy ziemne" },
  { code: "SOYBEANS", name: "Soja" },
  { code: "NUTS", name: "Orzechy" },
  { code: "CELERY", name: "Seler" },
  { code: "MUSTARD", name: "Gorczyca" },
  { code: "SESAME", name: "Sezam" },
  { code: "SULPHITES", name: "Dwutlenek siarki" },
  { code: "LUPIN", name: "Łubin" },
  { code: "MOLLUSCS", name: "Mięczaki" },
];

export interface AllergenFilterProps {
  selectedAllergens: string[];
  onToggle: (code: string) => void;
  onClear: () => void;
}

export function AllergenFilter({
  selectedAllergens,
  onToggle,
  onClear,
}: AllergenFilterProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const count = selectedAllergens.length;

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Filter className="h-4 w-4" />
        Alergeny
        {count > 0 && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
            {count}
          </span>
        )}
      </Button>

      {open && (
        <div
          className={cn(
            "absolute left-0 top-full z-50 mt-1 w-64 animate-in fade-in-0 zoom-in-95 rounded-lg border bg-popover p-2 shadow-md"
          )}
        >
          <div className="mb-2 flex items-center gap-2 border-b pb-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="text-sm font-medium">Filtruj po alergenach</span>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {EU_ALLERGENS.map((a) => {
              const checked = selectedAllergens.includes(a.code);
              return (
                <label
                  key={a.code}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(a.code)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span>{a.name}</span>
                </label>
              );
            })}
          </div>
          {count > 0 && (
            <button
              type="button"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
              className="mt-2 w-full rounded py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Wyczyść filtry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
