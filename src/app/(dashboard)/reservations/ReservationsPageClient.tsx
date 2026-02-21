"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Check, X, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import { addDays, format, startOfDay } from "date-fns";
import { pl } from "date-fns/locale";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Oczekuje",
  CONFIRMED: "Potwierdzona",
  CANCELLED: "Anulowana",
  NO_SHOW: "Nie stawił się",
  COMPLETED: "Zakończona",
};

const SOURCE_LABELS: Record<string, string> = {
  PHONE: "Telefon",
  ONLINE: "Online",
  WALK_IN: "Na miejscu",
};

type ReservationRow = {
  id: string;
  roomId: string;
  roomName: string;
  tableId: string | null;
  tableNumber: number | null;
  date: string;
  timeFrom: string;
  timeTo: string | null;
  guestName: string;
  guestPhone: string | null;
  guestEmail: string | null;
  guestCount: number;
  notes: string | null;
  status: string;
  source: string;
  createdAt: string;
};

type RoomWithTables = {
  id: string;
  name: string;
  tables: { id: string; number: number; seats: number }[];
};

function overlaps(
  slotFrom: string,
  slotTo: string,
  resTimeFrom: string,
  resTimeTo: string | null,
  date: string
): boolean {
  const slotStart = new Date(`${date}T${slotFrom}`).getTime();
  const slotEnd = new Date(`${date}T${slotTo}`).getTime();
  const resStart = new Date(`${date}T${resTimeFrom}`).getTime();
  const resEnd = resTimeTo
    ? new Date(`${date}T${resTimeTo}`).getTime()
    : resStart + 2 * 60 * 60 * 1000;
  return resStart < slotEnd && resEnd > slotStart;
}

export default function ReservationsPageClient() {
  const queryClient = useQueryClient();
  const [dateFrom, setDateFrom] = useState(() => format(startOfDay(new Date()), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(() => format(addDays(new Date(), 7), "yyyy-MM-dd"));
  const [roomId, setRoomId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    roomId: "",
    tableId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    timeFrom: "12:00",
    timeTo: "14:00",
    guestName: "",
    guestPhone: "",
    guestEmail: "",
    guestCount: "2",
    notes: "",
  });

  const { data: reservations = [], isLoading } = useQuery<ReservationRow[]>({
    queryKey: ["reservations", dateFrom, dateTo, roomId, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("dateFrom", dateFrom);
      params.set("dateTo", dateTo);
      if (roomId) params.set("roomId", roomId);
      if (status) params.set("status", status);
      const r = await fetch(`/api/reservations?${params}`);
      if (!r.ok) throw new Error("Błąd pobierania rezerwacji");
      return r.json();
    },
  });

  const { data: roomsAll = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["rooms-all"],
    queryFn: async () => {
      const r = await fetch("/api/rooms?all=true");
      if (!r.ok) throw new Error("Błąd");
      const d = await r.json();
      return Array.isArray(d) ? d.map((x: { id: string; name: string }) => ({ id: x.id, name: x.name })) : [];
    },
  });

  const { data: roomsWithTables = [] } = useQuery<RoomWithTables[]>({
    queryKey: ["rooms-with-tables"],
    queryFn: async () => {
      const r = await fetch("/api/rooms");
      if (!r.ok) throw new Error("Błąd");
      const d = await r.json();
      return Array.isArray(d)
        ? d.map((room: { id: string; name: string; tables: { id: string; number: number; seats: number }[] }) => ({
            id: room.id,
            name: room.name,
            tables: (room.tables ?? []).map((t: { id: string; number: number; seats: number }) => ({
              id: t.id,
              number: t.number,
              seats: t.seats,
            })),
          }))
        : [];
    },
    enabled: formOpen,
  });

  const { data: formSlotReservations = [] } = useQuery<ReservationRow[]>({
    queryKey: ["reservations-slot", form.roomId, form.date],
    queryFn: async () => {
      if (!form.roomId || !form.date) return [];
      const params = new URLSearchParams();
      params.set("dateFrom", form.date);
      params.set("dateTo", form.date);
      params.set("roomId", form.roomId);
      const r = await fetch(`/api/reservations?${params}`);
      if (!r.ok) return [];
      return r.json();
    },
    enabled: formOpen && !!form.roomId && !!form.date,
  });

  const reservationsForSlot = useMemo(() => {
    if (!form.roomId || !form.date || !form.timeFrom || !form.timeTo) return [];
    return formSlotReservations.filter(
      (r) =>
        r.roomId === form.roomId &&
        r.date === form.date &&
        r.status !== "CANCELLED" &&
        r.status !== "NO_SHOW" &&
        overlaps(form.timeFrom, form.timeTo, r.timeFrom, r.timeTo, form.date)
    );
  }, [formSlotReservations, form.roomId, form.date, form.timeFrom, form.timeTo]);

  const availableTables = useMemo(() => {
    const room = roomsWithTables.find((r) => r.id === form.roomId);
    if (!room) return [];
    const reservedIds = new Set(reservationsForSlot.map((r) => r.tableId).filter(Boolean));
    return room.tables.filter((t) => !reservedIds.has(t.id));
  }, [roomsWithTables, form.roomId, reservationsForSlot]);

  const confirmMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED" }),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error ?? "Błąd");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error ?? "Błąd");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  const noShowMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "NO_SHOW" }),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error ?? "Błąd");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: form.roomId,
          tableId: form.tableId || null,
          date: form.date,
          timeFrom: form.timeFrom,
          timeTo: form.timeTo || null,
          guestName: form.guestName.trim(),
          guestPhone: form.guestPhone.trim() || null,
          guestEmail: form.guestEmail.trim() || null,
          guestCount: parseInt(form.guestCount, 10) || 2,
          notes: form.notes.trim() || null,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Błąd tworzenia rezerwacji");
      return d;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setFormOpen(false);
      setForm({
        roomId: "",
        tableId: "",
        date: format(new Date(), "yyyy-MM-dd"),
        timeFrom: "12:00",
        timeTo: "14:00",
        guestName: "",
        guestPhone: "",
        guestEmail: "",
        guestCount: "2",
        notes: "",
      });
    },
  });

  const handleSubmit = () => {
    if (!form.guestName.trim() || !form.roomId || !form.date || !form.timeFrom) return;
    createMutation.mutate();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Rezerwacje</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nowa rezerwacja (telefon)
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 rounded-lg border p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Od</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Do</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Sala</label>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className={cn(
              "h-9 w-44 rounded-md border border-input bg-background px-3 py-1 text-sm"
            )}
          >
            <option value="">Wszystkie</option>
            {roomsAll.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={cn(
              "h-9 w-44 rounded-md border border-input bg-background px-3 py-1 text-sm"
            )}
          >
            <option value="">Wszystkie</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Ładowanie…</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-2 text-left">Data</th>
                <th className="p-2 text-left">Godzina</th>
                <th className="p-2 text-left">Sala</th>
                <th className="p-2 text-left">Stolik</th>
                <th className="p-2 text-left">Gość</th>
                <th className="p-2 text-left">Telefon</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Źródło</th>
                <th className="p-2 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="p-2">
                    {format(new Date(r.date), "d MMM yyyy", { locale: pl })}
                  </td>
                  <td className="p-2">
                    {r.timeFrom}
                    {r.timeTo ? ` – ${r.timeTo}` : ""}
                  </td>
                  <td className="p-2">{r.roomName}</td>
                  <td className="p-2">{r.tableNumber != null ? `#${r.tableNumber}` : "—"}</td>
                  <td className="p-2">{r.guestName}</td>
                  <td className="p-2">{r.guestPhone ?? "—"}</td>
                  <td className="p-2">{STATUS_LABELS[r.status] ?? r.status}</td>
                  <td className="p-2">{SOURCE_LABELS[r.source] ?? r.source}</td>
                  <td className="p-2 text-right">
                    {r.status === "PENDING" && (
                      <Button
                        size="sm"
                        variant="default"
                        className="mr-1"
                        onClick={() => confirmMutation.mutate(r.id)}
                        disabled={confirmMutation.isPending}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    {r.status === "CONFIRMED" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mr-1"
                        onClick={() => noShowMutation.mutate(r.id)}
                        disabled={noShowMutation.isPending}
                      >
                        <UserX className="h-3 w-3" />
                      </Button>
                    )}
                    {r.status !== "CANCELLED" && r.status !== "NO_SHOW" && r.status !== "COMPLETED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelMutation.mutate(r.id)}
                        disabled={cancelMutation.isPending}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reservations.length === 0 && (
            <p className="p-4 text-center text-muted-foreground">Brak rezerwacji w wybranym zakresie.</p>
          )}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nowa rezerwacja (telefon)</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Sala</label>
              <select
                value={form.roomId}
                onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value, tableId: "" }))}
                className={cn(
                  "h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                )}
              >
                <option value="">Wybierz salę</option>
                {roomsWithTables.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Data</label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Godzina od</label>
                <Input
                  type="time"
                  value={form.timeFrom}
                  onChange={(e) => setForm((f) => ({ ...f, timeFrom: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Godzina do</label>
                <Input
                  type="time"
                  value={form.timeTo}
                  onChange={(e) => setForm((f) => ({ ...f, timeTo: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Liczba gości</label>
                <Input
                  type="number"
                  min={1}
                  value={form.guestCount}
                  onChange={(e) => setForm((f) => ({ ...f, guestCount: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Stolik (wolne)</label>
              <select
                value={form.tableId}
                onChange={(e) => setForm((f) => ({ ...f, tableId: e.target.value }))}
                className={cn(
                  "h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                )}
              >
                <option value="">Bez przypisania</option>
                {availableTables.map((t) => (
                  <option key={t.id} value={t.id}>
                    Stolik #{t.number} ({t.seats} os.)
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Imię i nazwisko gościa *</label>
              <Input
                value={form.guestName}
                onChange={(e) => setForm((f) => ({ ...f, guestName: e.target.value }))}
                placeholder="Jan Kowalski"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Telefon</label>
              <Input
                value={form.guestPhone}
                onChange={(e) => setForm((f) => ({ ...f, guestPhone: e.target.value }))}
                placeholder="+48 123 456 789"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">E-mail</label>
              <Input
                type="email"
                value={form.guestEmail}
                onChange={(e) => setForm((f) => ({ ...f, guestEmail: e.target.value }))}
                placeholder="jan@example.com"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Notatki</label>
              <Input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Opcjonalnie"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Anuluj
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.guestName.trim() || !form.roomId || createMutation.isPending}
            >
              {createMutation.isPending ? "Zapisywanie…" : "Zapisz rezerwację"}
            </Button>
          </DialogFooter>
          {createMutation.error && (
            <p className="text-sm text-destructive">{String(createMutation.error.message)}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
