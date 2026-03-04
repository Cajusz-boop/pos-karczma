"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GuestCountFieldProps {
  value: number | null;
  onChange: (v: number | null) => void;
  guestCountSource?: string;
  disabled?: boolean;
}

export function GuestCountField({
  value,
  onChange,
  guestCountSource,
  disabled,
}: GuestCountFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.trim();
    if (v === "") {
      onChange(null);
      return;
    }
    const n = parseInt(v, 10);
    if (!isNaN(n) && n > 0) onChange(n);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="guestCount">Liczba gości</Label>
      {guestCountSource === "PARSED" && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Wykryto automatycznie — sprawdź poprawność
        </p>
      )}
      <Input
        id="guestCount"
        type="number"
        min={1}
        max={1500}
        value={value ?? ""}
        onChange={handleChange}
        placeholder="np. 80"
        className="h-14 text-2xl w-40"
        disabled={disabled}
      />
    </div>
  );
}
