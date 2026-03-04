"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { format, startOfWeek } from "date-fns";
import { WeekNavigator } from "@/components/imprezy/WeekNavigator";
import { EventCard } from "@/components/imprezy/EventCard";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const EVENT_TYPES = [
  { value: "", label: "Wszystkie typy" },
  { value: "WESELE", label: "Wesela" },
  { value: "CHRZCINY", label: "Chrzciny" },
  { value: "KOMUNIA", label: "Komunie" },
  { value: "URODZINY_ROCZNICA", label: "Urodziny" },
  { value: "POPRAWINY", label: "Poprawiny" },
  { value: "STYPA", label: "Stypy" },
  { value: "IMPREZA_FIRMOWA", label: "Firmowe" },
  { value: "INNE", label: "Inne" },
] as const;

const STATUS_FILTERS = [
  { value: "", label: "Wszystkie" },
  { value: "DRAFT", label: "🟡 Do uzupełnienia" },
  { value: "CONFIRMED", label: "🟢 Potwierdzone" },
  { value: "CANCELLED", label: "❌ Odwołane" },
] as const;

function getWeekBounds(d: Date) {
  const start = startOfWeek(d, { weekStartsOn: 1 });
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

async function fetchEvents(params: {
  weekStart: Date;
  weekEnd: Date;
  status?: string;
  type?: string;
}) {
  const sp = new URLSearchParams();
  sp.set("weekStart", format(params.weekStart, "yyyy-MM-dd"));
  sp.set("weekEnd", format(params.weekEnd, "yyyy-MM-dd"));
  if (params.status) sp.set("status", params.status);
  if (params.type) sp.set("type", params.type);
  const res = await fetch(`/api/events?${sp}`);
  if (!res.ok) throw new Error("Błąd pobierania imprez");
  return res.json();
}

export default function ImprezyPage() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const { start, end } = useMemo(() => getWeekBounds(weekStart), [weekStart]);

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ["events", format(start, "yyyy-MM-dd"), statusFilter, typeFilter],
    queryFn: () =>
      fetchEvents({
        weekStart: start,
        weekEnd: end,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Imprezy</h1>

      <div className="flex flex-col gap-4">
        <WeekNavigator weekStart={start} onWeekChange={setWeekStart} />

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium mr-2">Status:</span>
          {STATUS_FILTERS.map((s) => (
            <Button
              key={s.value}
              variant={statusFilter === s.value ? "default" : "outline"}
              size="sm"
              className="h-12"
              onClick={() => setStatusFilter(s.value)}
            >
              {s.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium mr-2">Typ:</span>
          {EVENT_TYPES.map((t) => (
            <Button
              key={t.value}
              variant={typeFilter === t.value ? "default" : "outline"}
              size="sm"
              className="h-12"
              onClick={() => setTypeFilter(t.value)}
            >
              {t.label}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="lg"
            className="h-12"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Odśwież
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-xl bg-muted" />
      ) : events.length === 0 ? (
        <p className="text-muted-foreground">
          Brak imprez w tym tygodniu{statusFilter || typeFilter ? " dla wybranych filtrów" : ""}.
        </p>
      ) : (
        <div className="space-y-4">
          {events.map((ev: Record<string, unknown>) => (
            <EventCard key={ev.id as number} event={ev as Parameters<typeof EventCard>[0]["event"]} />
          ))}
        </div>
      )}
    </div>
  );
}
