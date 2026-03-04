"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Package {
  id: number;
  name: string;
  eventType: string;
  itemCount: number;
}

interface PackageSelectorProps {
  eventType: string;
  selectedPackageId: number | null;
  onSelect: (id: number) => void;
  disabled?: boolean;
}

async function fetchPackages(eventType: string): Promise<Package[]> {
  const sp = new URLSearchParams();
  if (eventType) sp.set("eventType", eventType);
  const res = await fetch(`/api/pakiety?${sp}`);
  if (!res.ok) return [];
  return res.json();
}

export function PackageSelector({
  eventType,
  selectedPackageId,
  onSelect,
  disabled,
}: PackageSelectorProps) {
  const { data: packages = [] } = useQuery({
    queryKey: ["pakiety", eventType],
    queryFn: () => fetchPackages(eventType),
  });

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Pakiet menu</label>
      <div className="flex flex-wrap gap-2">
        {packages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak pakietów dla tego typu imprezy.</p>
        ) : (
          packages.map((pkg) => (
            <Button
              key={pkg.id}
              variant={selectedPackageId === pkg.id ? "default" : "outline"}
              size="lg"
              className={cn("h-12 text-base", selectedPackageId === pkg.id && "ring-2 ring-primary ring-offset-2")}
              onClick={() => onSelect(pkg.id)}
              disabled={disabled}
            >
              {pkg.name}
            </Button>
          ))
        )}
      </div>
    </div>
  );
}
