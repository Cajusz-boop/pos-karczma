"use client";

import Link from "next/link";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { EventStatusBadge } from "./EventStatusBadge";
import { CalendarLinkButton } from "./CalendarLinkButton";

const EVENT_TYPE_LABELS: Record<string, string> = {
  WESELE: "Wesele",
  POPRAWINY: "Poprawiny",
  CHRZCINY: "Chrzciny",
  KOMUNIA: "I Komunia",
  URODZINY_ROCZNICA: "Urodziny/Rocznice",
  STYPA: "Stypa",
  IMPREZA_FIRMOWA: "Impreza firmowa",
  CATERING: "Catering",
  SPOTKANIE: "Spotkanie",
  SYLWESTER: "Sylwester",
  INNE: "Inne",
};

interface EventCardProps {
  event: {
    id: number;
    title: string;
    eventType: string;
    roomName: string | null;
    startDate: string;
    endDate: string;
    guestCount: number | null;
    guestCountSource: string;
    status: string;
    googleEventUrl: string | null;
    package: { id: number; name: string } | null;
  };
}

export function EventCard({ event }: EventCardProps) {
  const guestLabel =
    event.guestCount != null
      ? event.guestCountSource === "PARSED"
        ? `~${event.guestCount} os. (wykryto)`
        : `${event.guestCount} os.`
      : "—";

  const guestColor =
    event.guestCount == null
      ? "text-red-600 dark:text-red-400"
      : event.guestCountSource === "PARSED"
        ? "text-amber-600 dark:text-amber-400"
        : "text-emerald-600 dark:text-emerald-400";

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <EventStatusBadge status={event.status as "DRAFT" | "CONFIRMED" | "CANCELLED"} />
            <span className="text-sm text-muted-foreground">
              {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
              {event.roomName && ` · ${event.roomName}`}
            </span>
          </div>
          <h3 className="font-semibold text-base truncate">{event.title || "Brak tytułu"}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(event.startDate), "EEEE d MMMM, HH:mm", { locale: pl })} —{" "}
            {format(new Date(event.endDate), "HH:mm", { locale: pl })}
          </p>
          <div className="flex flex-wrap gap-4 mt-2 text-sm">
            <span className={guestColor}>Liczba gości: {guestLabel}</span>
            <span>
              Pakiet: {event.package ? event.package.name : "⚠️ Brak pakietu"}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-shrink-0">
          <CalendarLinkButton url={event.googleEventUrl} />
          {event.status === "DRAFT" && (
            <Link href={`/imprezy/${event.id}`}>
              <Button size="lg" className="h-12 w-full sm:w-auto">
                Uzupełnij
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
