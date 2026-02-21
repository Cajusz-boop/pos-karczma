"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Coffee,
  RefreshCw,
  Check,
  AlertTriangle,
  Users,
  Clock,
  UtensilsCrossed,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

// ============================================================
// TYPES
// ============================================================

interface BreakfastGuest {
  roomNumber: string;
  guestName: string;
  guestId: string;
  guestCount: number;
  mealPlan: string;
  preferences: string[];
  allergens: string[];
  checkOut: string;
  served: boolean;
  servedAt?: string;
}

// ============================================================
// COMPONENT
// ============================================================

export default function BreakfastPage() {
  const [guests, setGuests] = useState<BreakfastGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [servedLocal, setServedLocal] = useState<Set<string>>(new Set());

  const fetchGuests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/hotel/breakfast");
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setGuests([]);
      } else {
        setGuests(data.guests ?? []);
      }
    } catch {
      setError("Błąd połączenia z systemem hotelowym");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuests();
    const interval = setInterval(fetchGuests, 60_000);
    return () => clearInterval(interval);
  }, [fetchGuests]);

  const toggleServed = (roomNumber: string) => {
    setServedLocal((prev) => {
      const next = new Set(prev);
      if (next.has(roomNumber)) {
        next.delete(roomNumber);
      } else {
        next.add(roomNumber);
      }
      return next;
    });
  };

  const isServed = (g: BreakfastGuest) => g.served || servedLocal.has(g.roomNumber);

  const totalGuests = guests.reduce((sum, g) => sum + g.guestCount, 0);
  const servedCount = guests.filter((g) => isServed(g)).length;
  const pendingCount = guests.length - servedCount;

  const now = new Date();
  const timeStr = now.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-800 bg-stone-950/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link href="/kitchen">
            <Button variant="ghost" size="icon" className="text-stone-400 hover:text-stone-100">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Coffee className="h-7 w-7 text-amber-400" />
          <div>
            <h1 className="text-xl font-bold">Śniadania</h1>
            <p className="text-xs text-stone-400">{dateStr}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-stone-400" />
            <span className="font-mono text-lg tabular-nums">{timeStr}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-stone-700 text-stone-300 hover:bg-stone-800"
            onClick={fetchGuests}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Odśwież
          </Button>
        </div>
      </header>

      {/* Stats bar */}
      <div className="flex items-center gap-6 border-b border-stone-800 bg-stone-900/50 px-4 py-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-stone-400" />
          <span className="text-sm text-stone-400">Pokoi:</span>
          <span className="font-bold">{guests.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-4 w-4 text-stone-400" />
          <span className="text-sm text-stone-400">Osób:</span>
          <span className="font-bold">{totalGuests}</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-400" />
          <span className="text-sm text-stone-400">Obsłużono:</span>
          <span className="font-bold text-emerald-400">{servedCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-400" />
          <span className="text-sm text-stone-400">Oczekuje:</span>
          <span className="font-bold text-amber-400">{pendingCount}</span>
        </div>
      </div>

      {/* Content */}
      <main className="p-4">
        {/* Error state */}
        {error && (
          <div className="mx-auto max-w-md rounded-xl border border-red-800/50 bg-red-950/30 p-6 text-center">
            <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-red-400" />
            <p className="text-lg font-semibold text-red-300">{error}</p>
            <p className="mt-1 text-sm text-stone-400">
              Sprawdź konfigurację integracji hotelowej w ustawieniach
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 border-red-800 text-red-300 hover:bg-red-950"
              onClick={fetchGuests}
            >
              Spróbuj ponownie
            </Button>
          </div>
        )}

        {/* Loading state */}
        {loading && !error && guests.length === 0 && (
          <div className="flex items-center justify-center gap-3 py-16">
            <RefreshCw className="h-6 w-6 animate-spin text-amber-400" />
            <span className="text-lg text-stone-400">Pobieranie listy gości…</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && guests.length === 0 && (
          <div className="mx-auto max-w-md py-16 text-center">
            <Coffee className="mx-auto mb-4 h-16 w-16 text-stone-600" />
            <p className="text-xl font-semibold text-stone-400">Brak gości na śniadanie</p>
            <p className="mt-1 text-sm text-stone-500">
              Żaden pokój nie ma wykupionego śniadania na dziś
            </p>
          </div>
        )}

        {/* Guest list */}
        {guests.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* Pending first, then served */}
            {[...guests]
              .sort((a, b) => {
                const aServed = isServed(a) ? 1 : 0;
                const bServed = isServed(b) ? 1 : 0;
                if (aServed !== bServed) return aServed - bServed;
                return a.roomNumber.localeCompare(b.roomNumber, "pl", { numeric: true });
              })
              .map((guest) => {
                const served = isServed(guest);
                return (
                  <button
                    key={guest.roomNumber}
                    type="button"
                    onClick={() => toggleServed(guest.roomNumber)}
                    className={cn(
                      "relative flex flex-col rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.98]",
                      served
                        ? "border-emerald-700/50 bg-emerald-950/30 opacity-60"
                        : "border-stone-700 bg-stone-900 hover:border-amber-600"
                    )}
                  >
                    {/* Room number badge */}
                    <div className="flex items-start justify-between">
                      <div
                        className={cn(
                          "rounded-lg px-3 py-1 text-xl font-black tabular-nums",
                          served
                            ? "bg-emerald-900/50 text-emerald-400"
                            : "bg-amber-900/50 text-amber-300"
                        )}
                      >
                        {guest.roomNumber}
                      </div>
                      {served && (
                        <div className="rounded-full bg-emerald-600 p-1">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Guest info */}
                    <div className="mt-3">
                      <p className="text-lg font-semibold">{guest.guestName}</p>
                      <div className="mt-1 flex items-center gap-3 text-sm text-stone-400">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {guest.guestCount} {guest.guestCount === 1 ? "osoba" : guest.guestCount < 5 ? "osoby" : "osób"}
                        </span>
                        <span className="rounded bg-stone-800 px-1.5 py-0.5 text-xs font-medium">
                          {guest.mealPlan}
                        </span>
                      </div>
                    </div>

                    {/* Preferences */}
                    {guest.preferences.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {guest.preferences.map((pref) => (
                          <span
                            key={pref}
                            className="rounded-full bg-blue-900/40 px-2 py-0.5 text-xs text-blue-300"
                          >
                            {pref}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Allergens */}
                    {guest.allergens.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {guest.allergens.map((allergen) => (
                          <span
                            key={allergen}
                            className="rounded-full bg-red-900/40 px-2 py-0.5 text-xs font-medium text-red-300"
                          >
                            ⚠ {allergen}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Checkout date */}
                    {guest.checkOut && (
                      <p className="mt-2 text-xs text-stone-500">
                        Wymeldowanie: {new Date(guest.checkOut).toLocaleDateString("pl-PL")}
                      </p>
                    )}

                    {/* Served timestamp */}
                    {served && guest.servedAt && (
                      <p className="mt-1 text-xs text-emerald-500">
                        Obsłużono: {new Date(guest.servedAt).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </button>
                );
              })}
          </div>
        )}
      </main>
    </div>
  );
}
