"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { format, startOfWeek, addWeeks, subWeeks } from "date-fns";
import { pl } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { WeekNavigator } from "@/components/imprezy/WeekNavigator";
import { CalculatorTab } from "./CalculatorTab";
import { PackagesTab } from "./PackagesTab";
import { Calculator, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ZaopatrzeniePage() {
  const [activeTab, setActiveTab] = useState<"calculator" | "packages">(
    "calculator"
  );
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">
        Zaopatrzenie — Kalkulator zapotrzebowania
      </h1>

      <div className="flex gap-2 border-b">
        <button
          type="button"
          onClick={() => setActiveTab("calculator")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 -mb-px font-medium border-b-2 transition-colors",
            activeTab === "calculator"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Calculator className="h-4 w-4" />
          Kalkulator
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("packages")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 -mb-px font-medium border-b-2 transition-colors",
            activeTab === "packages"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Package className="h-4 w-4" />
          Pakiety menu
        </button>
      </div>

      {activeTab === "calculator" && (
        <CalculatorTab weekStart={weekStart} weekEnd={weekEnd} onWeekChange={setWeekStart} />
      )}
      {activeTab === "packages" && <PackagesTab />}
    </div>
  );
}
