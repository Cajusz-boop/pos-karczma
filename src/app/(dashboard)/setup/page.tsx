"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Store,
  Users,
  LayoutGrid,
  UtensilsCrossed,
  Printer,
  Rocket,
} from "lucide-react";

const STEPS = [
  { id: "welcome", title: "Witaj!", icon: Store },
  { id: "restaurant", title: "Restauracja", icon: Store },
  { id: "rooms", title: "Sale i stoliki", icon: LayoutGrid },
  { id: "menu", title: "Menu", icon: UtensilsCrossed },
  { id: "staff", title: "Zespół", icon: Users },
  { id: "printers", title: "Drukarki", icon: Printer },
  { id: "done", title: "Gotowe!", icon: Rocket },
];

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Restaurant info
  const [restName, setRestName] = useState("Karczma Łabędź");
  const [restNip, setRestNip] = useState("");
  const [restAddress, setRestAddress] = useState("");

  // Rooms
  const [roomName, setRoomName] = useState("Restauracja");
  const [roomCapacity, setRoomCapacity] = useState("50");
  const [tableCount, setTableCount] = useState("12");

  // Menu
  const [menuCategories, setMenuCategories] = useState("Zupy, Dania główne, Desery, Napoje, Alkohole");

  // Staff
  const [adminName, setAdminName] = useState("");
  const [adminPin, setAdminPin] = useState("");

  const handleFinish = async () => {
    setSaving(true);
    try {
      // Save restaurant config
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "restaurant_info",
          value: { name: restName, nip: restNip, address: restAddress },
        }),
      }).catch(() => {});

      // Create room with tables
      if (roomName.trim()) {
        const roomRes = await fetch("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: roomName.trim(),
            capacity: parseInt(roomCapacity) || 50,
            type: "RESTAURANT",
          }),
        }).catch(() => null);

        if (roomRes?.ok) {
          const roomData = await roomRes.json();
          const count = parseInt(tableCount) || 12;
          for (let i = 1; i <= count; i++) {
            await fetch("/api/rooms", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                roomId: roomData.room.id,
                number: i,
                seats: 4,
              }),
            }).catch(() => {});
          }
        }
      }

      // Create categories
      if (menuCategories.trim()) {
        const cats = menuCategories.split(",").map((c) => c.trim()).filter(Boolean);
        for (const cat of cats) {
          await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: cat }),
          }).catch(() => {});
        }
      }

      // Mark setup as complete
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "setup_completed", value: { completed: true, date: new Date().toISOString() } }),
      }).catch(() => {});

      setStep(STEPS.length - 1);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const canNext = () => {
    if (step === 1) return restName.trim().length > 0;
    if (step === 2) return roomName.trim().length > 0;
    return true;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 dark:from-stone-950 dark:to-stone-900">
      <div className="w-full max-w-lg rounded-2xl border bg-background p-6 shadow-xl">
        {/* Progress */}
        <div className="mb-6 flex items-center justify-center gap-1">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={cn(
                "h-2 w-8 rounded-full transition-colors",
                i <= step ? "bg-blue-500" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Step content */}
        {step === 0 && (
          <div className="text-center space-y-4">
            <Store className="mx-auto h-16 w-16 text-blue-500" />
            <h1 className="text-3xl font-black">Witaj w POS Karczma!</h1>
            <p className="text-muted-foreground">
              Skonfigurujemy system w kilku prostych krokach.
              Zajmie to około 2 minuty.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center">
              <Store className="mx-auto mb-2 h-10 w-10 text-blue-500" />
              <h2 className="text-xl font-bold">Dane restauracji</h2>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Nazwa restauracji *</label>
              <Input value={restName} onChange={(e) => setRestName(e.target.value)} autoFocus />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">NIP</label>
              <Input value={restNip} onChange={(e) => setRestNip(e.target.value)} placeholder="opcjonalnie" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Adres</label>
              <Input value={restAddress} onChange={(e) => setRestAddress(e.target.value)} placeholder="opcjonalnie" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center">
              <LayoutGrid className="mx-auto mb-2 h-10 w-10 text-blue-500" />
              <h2 className="text-xl font-bold">Sale i stoliki</h2>
              <p className="text-sm text-muted-foreground">Możesz dodać więcej sal później</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Nazwa sali *</label>
              <Input value={roomName} onChange={(e) => setRoomName(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium">Pojemność</label>
                <Input type="number" value={roomCapacity} onChange={(e) => setRoomCapacity(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium">Liczba stolików</label>
                <Input type="number" value={tableCount} onChange={(e) => setTableCount(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center">
              <UtensilsCrossed className="mx-auto mb-2 h-10 w-10 text-blue-500" />
              <h2 className="text-xl font-bold">Kategorie menu</h2>
              <p className="text-sm text-muted-foreground">Wpisz kategorie oddzielone przecinkami</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Kategorie</label>
              <textarea
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm min-h-[80px]"
                value={menuCategories}
                onChange={(e) => setMenuCategories(e.target.value)}
                placeholder="Zupy, Dania główne, Desery, Napoje"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Produkty dodasz później w Ustawieniach → Produkty lub przez import CSV.
            </p>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="text-center">
              <Users className="mx-auto mb-2 h-10 w-10 text-blue-500" />
              <h2 className="text-xl font-bold">Pierwszy administrator</h2>
              <p className="text-sm text-muted-foreground">Konto administratora do zarządzania systemem</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Imię</label>
              <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="np. Jan Kowalski" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">PIN (4 cyfry)</label>
              <Input type="password" maxLength={4} value={adminPin} onChange={(e) => setAdminPin(e.target.value)} placeholder="••••" className="text-center text-2xl tracking-[0.5em]" />
            </div>
            <p className="text-xs text-muted-foreground">
              Więcej pracowników dodasz w Ustawieniach → Użytkownicy.
            </p>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div className="text-center">
              <Printer className="mx-auto mb-2 h-10 w-10 text-blue-500" />
              <h2 className="text-xl font-bold">Drukarki</h2>
              <p className="text-sm text-muted-foreground">Drukarki skonfigurujesz później w ustawieniach</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-2">
              <p>System obsługuje:</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Drukarka fiskalna (Posnet, Elzab, Novitus)</li>
                <li>Drukarki kuchenne (bonowniki)</li>
                <li>Połączenie: USB, TCP/IP, COM</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                Bez drukarki system działa w trybie demo (paragony na ekranie).
              </p>
            </div>
          </div>
        )}

        {step === STEPS.length - 1 && (
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/30">
              <Check className="h-10 w-10 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-black">Gotowe!</h1>
            <p className="text-muted-foreground">
              System jest skonfigurowany. Możesz zacząć pracę.
            </p>
            <Button size="lg" className="gap-2" onClick={() => router.push("/pos")}>
              <Rocket className="h-5 w-5" />
              Przejdź do POS
            </Button>
          </div>
        )}

        {/* Navigation */}
        {step < STEPS.length - 1 && (
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Wstecz
            </Button>

            {step < 5 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext()}
                className="gap-1"
              >
                Dalej
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={saving} className="gap-1">
                {saving ? "Konfigurowanie…" : "Zakończ konfigurację"}
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
