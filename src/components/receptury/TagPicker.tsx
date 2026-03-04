"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

interface Tag {
  id: number;
  name: string;
  color: string;
  recipeCount?: number;
}

interface TagPickerProps {
  value: number[];
  onChange: (tagIds: number[]) => void;
  disabled?: boolean;
}

async function fetchTags() {
  const res = await fetch("/api/tagi");
  if (!res.ok) return [];
  return res.json() as Promise<Tag[]>;
}

export function TagPicker({ value, onChange, disabled }: TagPickerProps) {
  const { data: tags = [] } = useQuery({ queryKey: ["tags"], queryFn: fetchTags });

  const toggle = (tagId: number) => {
    if (value.includes(tagId)) {
      onChange(value.filter((id) => id !== tagId));
    } else {
      onChange([...value, tagId]);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Tagi</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <Button
            key={t.id}
            type="button"
            variant={value.includes(t.id) ? "default" : "outline"}
            size="sm"
            className="h-9"
            style={!value.includes(t.id) ? { borderColor: t.color } : { backgroundColor: t.color, borderColor: t.color }}
            onClick={() => !disabled && toggle(t.id)}
            disabled={disabled}
          >
            {t.name}
          </Button>
        ))}
        {tags.length === 0 && (
          <span className="text-sm text-muted-foreground">Brak tagów. Dodaj je w ustawieniach tagów.</span>
        )}
      </div>
    </div>
  );
}
