"use client";

import { Button } from "@/components/ui/button";
import { format, startOfWeek, addWeeks, subWeeks } from "date-fns";
import { pl } from "date-fns/locale";

interface WeekNavigatorProps {
  weekStart: Date;
  onWeekChange: (d: Date) => void;
}

export function WeekNavigator({ weekStart, onWeekChange }: WeekNavigatorProps) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const goToCurrent = () => onWeekChange(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const goPrev = () => onWeekChange(subWeeks(weekStart, 1));
  const goNext = () => onWeekChange(addWeeks(weekStart, 1));

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button variant="outline" size="lg" className="h-12 min-w-[100px]" onClick={goPrev}>
        ← Poprzedni
      </Button>
      <Button variant="outline" size="lg" className="h-12 min-w-[180px]" onClick={goToCurrent}>
        Bieżący tydzień
      </Button>
      <Button variant="outline" size="lg" className="h-12 min-w-[100px]" onClick={goNext}>
        Następny →
      </Button>
      <span className="text-base font-medium ml-2">
        {format(weekStart, "d MMM", { locale: pl })} — {format(weekEnd, "d MMM yyyy", { locale: pl })}
      </span>
    </div>
  );
}
