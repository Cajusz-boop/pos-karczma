"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Plus, Play, FileText, UtensilsCrossed, Calendar } from "lucide-react";

const EVENT_LABELS: Record<string, string> = {
  WEDDING: "Wesele",
  EIGHTEENTH: "18-tka",
  CORPORATE: "Firmówka",
  COMMUNION: "Komunia",
  CHRISTENING: "Chrzciny",
  FUNERAL: "Stypa",
  OTHER: "Inne",
};

const STATUS_LABELS: Record<string, string> = {
  INQUIRY: "Zapytanie",
  CONFIRMED: "Potwierdzona",
  DEPOSIT_PAID: "Zaliczka wpłacona",
  IN_PROGRESS: "W trakcie",
  COMPLETED: "Zakończona",
  CANCELLED: "Anulowana",
};

export default function BanquetsPage() {
  const [tab, setTab] = useState<"events" | "menus">("events");
  const queryClient = useQueryClient();

  const { data: events = [] } = useQuery({
    queryKey: ["banquets"],
    queryFn: async () => {
      const r = await fetch("/api/banquets");
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
  });

  const { data: menus = [] } = useQuery({
    queryKey: ["banquet-menus"],
    queryFn: async () => {
      const r = await fetch("/api/banquets/menus");
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    enabled: tab === "menus",
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms-simple"],
    queryFn: async () => {
      const r = await fetch("/api/rooms");
      if (!r.ok) throw new Error("Błąd");
      const d = await r.json();
      return Array.isArray(d) ? d.map((x: { id: string; name: string }) => ({ id: x.id, name: x.name })) : [];
    },
    enabled: tab === "events",
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-simple"],
    queryFn: async () => {
      const r = await fetch("/api/products");
      if (!r.ok) throw new Error("Błąd");
      const d = await r.json();
      return (d.products ?? []).map((p: { id: string; name: string; priceGross: number }) => ({ id: p.id, name: p.name, priceGross: p.priceGross }));
    },
    enabled: tab === "menus",
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Bankiety</h1>
      <div className="flex gap-2 border-b pb-2">
        <Button variant={tab === "events" ? "default" : "outline"} size="sm" onClick={() => setTab("events")}>
          <Calendar className="mr-1 h-4 w-4" />
          Imprezy
        </Button>
        <Button variant={tab === "menus" ? "default" : "outline"} size="sm" onClick={() => setTab("menus")}>
          <UtensilsCrossed className="mr-1 h-4 w-4" />
          Szablony menu
        </Button>
      </div>

      {tab === "events" && (
        <EventsSection
          events={events}
          rooms={rooms}
          menus={menus}
          onInvalidate={() => queryClient.invalidateQueries({ queryKey: ["banquets"] })}
        />
      )}
      {tab === "menus" && (
        <MenusSection
          menus={menus}
          products={products}
          onInvalidate={() => queryClient.invalidateQueries({ queryKey: ["banquet-menus"] })}
        />
      )}
    </div>
  );
}

function EventsSection({
  events,
  rooms,
  menus,
  onInvalidate,
}: {
  events: Array<{
    id: string;
    eventType: string;
    guestCount: number;
    menuName?: string;
    pricePerPerson: number;
    depositRequired: number;
    depositPaid: number;
    status: string;
    contactPerson: string;
    reservation?: { date: string; timeFrom: string; guestName: string };
    rooms?: Array<{ name: string }>;
    activeOrderId: string | null;
    activeOrderNumber: number | null;
  }>;
  rooms: Array<{ id: string; name: string }>;
  menus: Array<{ id: string; name: string; pricePerPerson: number }>;
  onInvalidate: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<(typeof events)[0] | null>(null);
  const [form, setForm] = useState({
    roomIds: [] as string[],
    eventType: "WEDDING",
    guestCount: "100",
    menuId: "",
    pricePerPerson: "",
    depositRequired: "",
    contactPerson: "",
    contactPhone: "",
    contactEmail: "",
    notes: "",
    date: new Date().toISOString().slice(0, 10),
    timeFrom: "14:00",
    timeTo: "",
    guestName: "",
  });
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advancePayment, setAdvancePayment] = useState("TRANSFER");
  const [advanceNip, setAdvanceNip] = useState("");
  const [advanceName, setAdvanceName] = useState("");
  const [advanceAddress, setAdvanceAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/banquets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomIds: form.roomIds.length ? form.roomIds : rooms.slice(0, 1).map((r) => r.id),
          eventType: form.eventType,
          guestCount: parseInt(form.guestCount, 10) || 1,
          menuId: form.menuId || undefined,
          pricePerPerson: parseFloat(form.pricePerPerson) || 0,
          depositRequired: parseFloat(form.depositRequired) || 0,
          contactPerson: form.contactPerson.trim(),
          contactPhone: form.contactPhone.trim(),
          contactEmail: form.contactEmail.trim() || undefined,
          notes: form.notes.trim() || undefined,
          date: form.date,
          timeFrom: form.timeFrom,
          timeTo: form.timeTo || undefined,
          guestName: form.guestName.trim() || form.contactPerson.trim(),
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Błąd");
      return data;
    },
    onSuccess: () => {
      onInvalidate();
      setDialogOpen(false);
      setForm({ ...form, guestName: "", contactPerson: "", contactPhone: "", contactEmail: "", notes: "" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const r = await fetch(`/api/banquets/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Błąd");
    },
    onSuccess: () => onInvalidate(),
  });

  const startMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const r = await fetch(`/api/banquets/${eventId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Błąd");
      return data;
    },
    onSuccess: (data) => {
      onInvalidate();
      if (data.orderId) window.location.href = `/pos/order/${data.orderId}`;
    },
  });

  const openAdvance = (ev: (typeof events)[0]) => {
    setSelectedEvent(ev);
    setAdvanceAmount(String(ev.depositRequired || ""));
    setAdvancePayment("TRANSFER");
    setAdvanceNip("");
    setAdvanceName("");
    setAdvanceAddress("");
    setError(null);
    setAdvanceOpen(true);
  };

  const submitAdvance = async () => {
    if (!selectedEvent || !advanceAmount) return;
    const amount = parseFloat(advanceAmount.replace(",", "."));
    if (isNaN(amount) || amount <= 0) {
      setError("Podaj kwotę zaliczki > 0");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/invoices/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          banquetEventId: selectedEvent.id,
          amount,
          paymentMethod: advancePayment,
          buyerNip: advanceNip.trim() || undefined,
          buyerName: advanceName.trim() || undefined,
          buyerAddress: advanceAddress.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd wystawiania faktury");
      setAdvanceOpen(false);
      setSelectedEvent(null);
      onInvalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const toggleRoom = (id: string) => {
    setForm((f) => ({
      ...f,
      roomIds: f.roomIds.includes(id) ? f.roomIds.filter((x) => x !== id) : [...f.roomIds, id],
    }));
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setDialogOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Nowa impreza
      </Button>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 text-left">Data</th>
              <th className="p-2 text-left">Typ</th>
              <th className="p-2 text-left">Goście</th>
              <th className="p-2 text-right">Cena/os.</th>
              <th className="p-2 text-right">Zaliczka</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id} className={cn("border-t", ev.status === "CANCELLED" && "opacity-60")}>
                <td className="p-2">
                  {ev.reservation?.date ? new Date(ev.reservation.date).toLocaleDateString("pl-PL") : "—"}
                </td>
                <td className="p-2">{EVENT_LABELS[ev.eventType] ?? ev.eventType}</td>
                <td className="p-2">{ev.guestCount}</td>
                <td className="p-2 text-right">{Number(ev.pricePerPerson).toFixed(2)} zł</td>
                <td className="p-2 text-right">
                  {Number(ev.depositPaid).toFixed(2)} / {Number(ev.depositRequired).toFixed(2)} zł
                </td>
                <td className="p-2">{STATUS_LABELS[ev.status] ?? ev.status}</td>
                <td className="p-2 flex flex-wrap gap-1">
                  {ev.status !== "CANCELLED" && ev.status !== "COMPLETED" && !ev.activeOrderId && (
                    <Button variant="outline" size="sm" onClick={() => startMutation.mutate(ev.id)}>
                      <Play className="mr-1 h-3 w-3" />
                      Start bankietu
                    </Button>
                  )}
                  {ev.activeOrderId && (
                    <Link href={`/pos/order/${ev.activeOrderId}`}>
                      <Button variant="default" size="sm">Zamówienie #{ev.activeOrderNumber}</Button>
                    </Link>
                  )}
                  {ev.status !== "CANCELLED" && (
                    <Button variant="outline" size="sm" onClick={() => openAdvance(ev)}>
                      <FileText className="mr-1 h-3 w-3" />
                      Zaliczka
                    </Button>
                  )}
                  {ev.status !== "CANCELLED" && ev.status !== "COMPLETED" && (
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => cancelMutation.mutate(ev.id)}>
                      Anuluj imprezę
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {events.length === 0 && <p className="text-muted-foreground">Brak imprez. Dodaj nową imprezę.</p>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nowa impreza bankietowa</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Sale (wybierz co najmniej jedną)</label>
            <div className="flex flex-wrap gap-2">
              {rooms.map((r) => (
                <Button
                  key={r.id}
                  type="button"
                  variant={form.roomIds.includes(r.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleRoom(r.id)}
                >
                  {r.name}
                </Button>
              ))}
            </div>
            <label className="text-sm font-medium">Typ imprezy</label>
            <select className="w-full rounded border p-2" value={form.eventType} onChange={(e) => setForm((f) => ({ ...f, eventType: e.target.value }))}>
              {Object.entries(EVENT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <label className="text-sm font-medium">Data *</label>
            <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            <label className="text-sm font-medium">Godzina rozpoczęcia *</label>
            <Input type="time" value={form.timeFrom} onChange={(e) => setForm((f) => ({ ...f, timeFrom: e.target.value }))} />
            <label className="text-sm font-medium">Liczba gości *</label>
            <Input type="number" min={1} value={form.guestCount} onChange={(e) => setForm((f) => ({ ...f, guestCount: e.target.value }))} />
            <label className="text-sm font-medium">Menu (opcjonalnie)</label>
            <select
              className="w-full rounded border p-2"
              value={form.menuId}
              onChange={(e) => {
                const id = e.target.value;
                const m = menus.find((x) => x.id === id);
                setForm((f) => ({ ...f, menuId: id, pricePerPerson: m ? String(m.pricePerPerson) : f.pricePerPerson }));
              }}
            >
              <option value="">— wybierz —</option>
              {menus.map((m) => (
                <option key={m.id} value={m.id}>{m.name} — {Number(m.pricePerPerson).toFixed(2)} zł/os.</option>
              ))}
            </select>
            <label className="text-sm font-medium">Cena za osobę (zł)</label>
            <Input type="number" step="0.01" value={form.pricePerPerson} onChange={(e) => setForm((f) => ({ ...f, pricePerPerson: e.target.value }))} />
            <label className="text-sm font-medium">Zaliczka wymagana (zł)</label>
            <Input type="number" step="0.01" value={form.depositRequired} onChange={(e) => setForm((f) => ({ ...f, depositRequired: e.target.value }))} />
            <label className="text-sm font-medium">Osoba kontaktowa *</label>
            <Input value={form.contactPerson} onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))} placeholder="Imię i nazwisko" />
            <label className="text-sm font-medium">Telefon *</label>
            <Input value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} placeholder="+48 ..." />
            <label className="text-sm font-medium">E-mail</label>
            <Input type="email" value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} />
            <label className="text-sm font-medium">Nazwa gościa / opis</label>
            <Input value={form.guestName} onChange={(e) => setForm((f) => ({ ...f, guestName: e.target.value }))} placeholder="np. Wesele Kowalskich" />
            <label className="text-sm font-medium">Notatki</label>
            <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Anuluj</Button>
            <Button
              disabled={!form.contactPerson.trim() || !form.contactPhone.trim() || !form.date || !form.timeFrom || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? "Zapisywanie…" : "Utwórz imprezę"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={advanceOpen} onOpenChange={setAdvanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Faktura zaliczkowa</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {EVENT_LABELS[selectedEvent.eventType] ?? selectedEvent.eventType} —{" "}
                {selectedEvent.reservation?.date ? new Date(selectedEvent.reservation.date).toLocaleDateString("pl-PL") : ""} ({selectedEvent.guestCount} os.)
              </p>
              <div>
                <label className="text-sm font-medium">Kwota zaliczki (zł) *</label>
                <Input type="number" step="0.01" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Forma płatności</label>
                <select className="mt-1 w-full rounded border px-2 py-1" value={advancePayment} onChange={(e) => setAdvancePayment(e.target.value)}>
                  <option value="TRANSFER">Przelew</option>
                  <option value="CASH">Gotówka</option>
                  <option value="CARD">Karta</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">NIP nabywcy</label>
                <Input value={advanceNip} onChange={(e) => setAdvanceNip(e.target.value)} className="mt-1" placeholder="np. 1234567890" />
              </div>
              <div>
                <label className="text-sm font-medium">Nazwa nabywcy</label>
                <Input value={advanceName} onChange={(e) => setAdvanceName(e.target.value)} className="mt-1" placeholder="Firma / Imię Nazwisko" />
              </div>
              <div>
                <label className="text-sm font-medium">Adres</label>
                <Input value={advanceAddress} onChange={(e) => setAdvanceAddress(e.target.value)} className="mt-1" placeholder="Adres" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdvanceOpen(false)}>Anuluj</Button>
            <Button onClick={submitAdvance} disabled={saving || !selectedEvent}>{saving ? "Wystawiam…" : "Wystaw fakturę zaliczkową"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MenusSection({
  menus,
  products,
  onInvalidate,
}: {
  menus: Array<{ id: string; name: string; eventType: string | null; pricePerPerson: number; itemsJson: unknown }>;
  products: Array<{ id: string; name: string; priceGross: number }>;
  onInvalidate: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [eventType, setEventType] = useState("");
  const [pricePerPerson, setPricePerPerson] = useState("");
  const [menuItems, setMenuItems] = useState<Array<{ productId: string; name: string; quantity: number; courseNumber: number }>>([]);
  const [_saving, _setSaving] = useState(false);

  const addItem = () => setMenuItems((prev) => [...prev, { productId: "", name: "", quantity: 1, courseNumber: 1 }]);
  const removeItem = (idx: number) => setMenuItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, f: Partial<{ productId: string; name: string; quantity: number; courseNumber: number }>) => {
    setMenuItems((prev) => prev.map((p, i) => (i === idx ? { ...p, ...f } : p)));
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const items = menuItems.filter((i) => i.productId).map((i) => ({
        productId: i.productId,
        name: products.find((p) => p.id === i.productId)?.name ?? i.name,
        quantity: i.quantity,
        courseNumber: i.courseNumber,
      }));
      const r = await fetch("/api/banquets/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          eventType: eventType || undefined,
          items,
          pricePerPerson: parseFloat(pricePerPerson) || 0,
          isTemplate: true,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Błąd");
      return data;
    },
    onSuccess: () => {
      onInvalidate();
      setDialogOpen(false);
      setName("");
      setEventType("");
      setPricePerPerson("");
      setMenuItems([]);
    },
  });

  return (
    <div className="space-y-4">
      <Button onClick={() => { setDialogOpen(true); setName(""); setEventType(""); setPricePerPerson(""); setMenuItems([]); addItem(); }}>
        <Plus className="mr-2 h-4 w-4" />
        Nowe menu (szablon)
      </Button>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 text-left">Nazwa</th>
              <th className="p-2 text-left">Typ</th>
              <th className="p-2 text-right">Cena/os.</th>
            </tr>
          </thead>
          <tbody>
            {menus.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="p-2 font-medium">{m.name}</td>
                <td className="p-2">{m.eventType ?? "—"}</td>
                <td className="p-2 text-right">{Number(m.pricePerPerson).toFixed(2)} zł</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {menus.length === 0 && <p className="text-muted-foreground">Brak szablonów menu. Dodaj menu, aby przypisywać je do imprez.</p>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nowe menu bankietowe</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nazwa *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="np. Menu Weselne Premium" />
            <label className="text-sm font-medium">Typ imprezy (opcjonalnie)</label>
            <select className="w-full rounded border p-2" value={eventType} onChange={(e) => setEventType(e.target.value)}>
              <option value="">—</option>
              {Object.entries(EVENT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <label className="text-sm font-medium">Cena za osobę (zł)</label>
            <Input type="number" step="0.01" value={pricePerPerson} onChange={(e) => setPricePerPerson(e.target.value)} />
            <label className="text-sm font-medium">Pozycje menu (ilość na osobę, kurs)</label>
            {menuItems.map((item, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-2 rounded border p-2">
                <select
                  className="min-w-[180px] rounded border p-1"
                  value={item.productId}
                  onChange={(e) => {
                    const p = products.find((x) => x.id === e.target.value);
                    updateItem(idx, { productId: e.target.value, name: p?.name ?? "" });
                  }}
                >
                  <option value="">— produkt —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {p.priceGross.toFixed(2)} zł</option>
                  ))}
                </select>
                <Input type="number" min={0.01} step="0.01" className="w-20" placeholder="Ilość/os." value={item.quantity || ""} onChange={(e) => updateItem(idx, { quantity: parseFloat(e.target.value) || 0 })} />
                <span className="text-xs text-muted-foreground">na os.</span>
                <Input type="number" min={1} className="w-16" placeholder="Kurs" value={item.courseNumber || ""} onChange={(e) => updateItem(idx, { courseNumber: parseInt(e.target.value, 10) || 1 })} />
                <span className="text-xs text-muted-foreground">kurs</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(idx)}>Usuń</Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="mr-1 h-4 w-4" />Dodaj pozycję</Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Anuluj</Button>
            <Button disabled={!name.trim() || saving} onClick={() => createMutation.mutate()}>{saving ? "Zapisywanie…" : "Zapisz menu"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
