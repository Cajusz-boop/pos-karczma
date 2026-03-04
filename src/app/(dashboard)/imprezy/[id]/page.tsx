"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { ArrowLeft, Check, XCircle } from "lucide-react";
import { EventStatusBadge } from "@/components/imprezy/EventStatusBadge";
import { CalendarLinkButton } from "@/components/imprezy/CalendarLinkButton";
import { GuestCountField } from "@/components/imprezy/GuestCountField";
import { PackageSelector } from "@/components/imprezy/PackageSelector";

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

async function fetchEvent(id: number) {
  const res = await fetch(`/api/events/${id}`);
  if (!res.ok) throw new Error("Błąd pobierania imprezy");
  return res.json();
}

export default function ImprezaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = parseInt(String(params.id), 10);

  const [guestCount, setGuestCount] = useState<number | null>(null);
  const [packageId, setPackageId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const initializedFor = useRef<number | null>(null);

  const { data: event, isLoading } = useQuery({
    queryKey: ["events", id],
    queryFn: () => fetchEvent(id),
    enabled: !isNaN(id),
  });

  useEffect(() => {
    if (!event || initializedFor.current === event.id) return;
    initializedFor.current = event.id;
    setGuestCount(event.guestCount ?? null);
    setPackageId(event.packageId ?? null);
    setNotes(event.notes ?? "");
  }, [event]);

  const updateMutation = useMutation({
    mutationFn: async (data: { guestCount?: number | null; packageId?: number | null; notes?: string }) => {
      const res = await fetch(`/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Błąd zapisu");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["events", id] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/events/${id}/cancel`, { method: "POST" });
      if (!res.ok) throw new Error("Błąd anulowania");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["events", id] });
      setCancelOpen(false);
      router.push("/imprezy");
    },
  });

  const gc = guestCount ?? event?.guestCount ?? null;
  const pkg = packageId ?? event?.packageId ?? null;
  const canConfirm = gc != null && gc > 0 && pkg != null;
  const displayGuestCount = guestCount ?? event?.guestCount ?? null;
  const displayPackageId = packageId ?? event?.packageId ?? null;
  const displayNotes = notes || event?.notes || "";

  if (isNaN(id)) return <p className="text-lg text-muted-foreground">Nieprawidłowe ID</p>;
  if (isLoading || !event) {
    return <div className="h-32 animate-pulse rounded-xl bg-muted" />;
  }

  const isCancelled = event.status === "CANCELLED";
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/imprezy">
          <Button variant="ghost" size="lg" className="h-12">
            <ArrowLeft className="h-5 w-5" />
            Powrót do listy
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <EventStatusBadge status={event.status} />
          <span className="text-sm text-muted-foreground">
            {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
            {event.roomName && ` · ${event.roomName}`}
          </span>
        </div>
        <h1 className="text-xl font-bold">{event.title || "Brak tytułu"}</h1>

        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <p>
            Kalendarz: {event.calendarName} ·{" "}
            {format(new Date(event.startDate), "EEEE d MMMM yyyy, HH:mm", { locale: pl })} —{" "}
            {format(new Date(event.endDate), "HH:mm", { locale: pl })}
          </p>
          {event.description && (
            <div className="mt-2 p-3 rounded-lg bg-muted/50">
              <p className="whitespace-pre-wrap">{event.description}</p>
            </div>
          )}
        </div>

        <div className="mt-4">
          <CalendarLinkButton url={event.googleEventUrl} />
        </div>
      </div>

      {!isCancelled && (
        <div className="rounded-xl border bg-card p-4 space-y-6">
          <h2 className="text-lg font-semibold">Dane do uzupełnienia przez recepcję</h2>

          <GuestCountField
            value={displayGuestCount}
            onChange={(v) => setGuestCount(v)}
            guestCountSource={event.guestCountSource}
          />

          <PackageSelector
            eventType={event.eventType}
            selectedPackageId={displayPackageId}
            onSelect={(id) => setPackageId(id)}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">Notatki recepcji</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Dodatkowe notatki…"
              value={displayNotes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <Button
              size="lg"
              className="h-14 text-base"
              disabled={!canConfirm || updateMutation.isPending}
              onClick={() =>
                updateMutation.mutate({
                  guestCount: gc ?? undefined,
                  packageId: pkg ?? undefined,
                  notes: displayNotes || undefined,
                })
              }
            >
              <Check className="h-5 w-5" />
              Potwierdź imprezę
            </Button>
            <Button
              variant="destructive"
              size="lg"
              className="h-14 text-base"
              onClick={() => setCancelOpen(true)}
            >
              <XCircle className="h-5 w-5" />
              Oznacz jako odwołana
            </Button>
          </div>
        </div>
      )}

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Oznaczyć imprezę jako odwołaną?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Ta impreza nie będzie brana pod uwagę przy kalkulacji zapotrzebowania.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Anuluj
            </Button>
            <Button variant="destructive" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
              Odwołaj imprezę
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
