"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { hydrateOrderFromApiCreate } from "@/lib/orders/order-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Hotel,
  User,
  Calendar,
  Users,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface HotelRoom {
  roomNumber: string;
  roomType?: string;
  guestName: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  reservationId: string;
  pax?: number;
  status?: string;
}

interface RoomsResponse {
  rooms: HotelRoom[];
  error?: string;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" });
  } catch {
    return dateStr;
  }
}

export function HotelOrdersClient() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.currentUser);
  const [selectedRoom, setSelectedRoom] = useState<HotelRoom | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("pl-PL", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const { data, isLoading, error, refetch } = useQuery<RoomsResponse>({
    queryKey: ["hotel-rooms"],
    queryFn: async () => {
      const res = await fetch("/api/hotel/rooms");
      if (!res.ok) throw new Error("Błąd pobierania pokoi");
      return res.json();
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const rooms = data?.rooms ?? [];
  const apiError = data?.error;

  const handleRoomClick = (room: HotelRoom) => {
    setSelectedRoom(room);
    setCreateError("");
  };

  const handleStartOrder = async () => {
    if (!selectedRoom || !currentUser) return;
    setCreating(true);
    setCreateError("");

    const doFetch = async (retry = 0): Promise<Response> => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: currentUser.id,
          guestCount: selectedRoom.pax ?? 1,
          type: "HOTEL_ROOM",
        }),
      });
      if (!res.ok && [502, 503, 504].includes(res.status) && retry < 1) {
        await new Promise((r) => setTimeout(r, 2000));
        return doFetch(retry + 1);
      }
      return res;
    };

    try {
      const res = await doFetch();
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        console.error("[HotelOrders] Server returned non-JSON:", res.status, contentType);
        setCreateError(
          res.status === 502 || res.status === 503 || res.status === 504
            ? "Serwer przeciążony — spróbuj za chwilę"
            : "Błąd serwera — spróbuj ponownie"
        );
        setCreating(false);
        return;
      }

      let resData: { order?: { id: string; orderNumber: number }; error?: string };
      try {
        resData = await res.json();
      } catch (parseErr) {
        console.error("[HotelOrders] JSON parse error:", parseErr);
        setCreateError("Błąd odpowiedzi serwera");
        setCreating(false);
        return;
      }

      if (!res.ok) {
        const msg =
          resData?.error ??
          (res.status === 401
            ? "Sesja wygasła — zaloguj się ponownie"
            : res.status >= 500
              ? "Błąd serwera — spróbuj za chwilę"
              : "Błąd tworzenia zamówienia");
        setCreateError(msg);
        setCreating(false);
        return;
      }

      const order = resData?.order;
      if (!order?.id) {
        setCreateError("Błąd odpowiedzi serwera");
        setCreating(false);
        return;
      }

      await hydrateOrderFromApiCreate({
        serverId: order.id,
        orderNumber: order.orderNumber,
        type: "HOTEL_ROOM",
        userId: currentUser.id,
        userName: currentUser.name ?? "",
        guestCount: selectedRoom.pax ?? 1,
      });

      router.push(
        `/pos/order/${order.id}?hotel=true&roomNumber=${encodeURIComponent(selectedRoom.roomNumber)}&guestName=${encodeURIComponent(selectedRoom.guestName)}&guestId=${encodeURIComponent(selectedRoom.guestId)}&checkOut=${encodeURIComponent(selectedRoom.checkOut)}`
      );
    } catch (err) {
      console.error("[HotelOrders] Error creating order:", err);
      setCreateError("Błąd połączenia");
      setCreating(false);
    }
  };

  const getRoomStatusColor = (status?: string) => {
    switch (status) {
      case "CHECKED_IN":
        return "bg-emerald-600 hover:bg-emerald-700 border-emerald-700 text-white";
      case "CONFIRMED":
        return "bg-amber-500 hover:bg-amber-600 border-amber-600 text-white";
      default:
        return "bg-brand-brown hover:brightness-110 border-[#704a2f] text-white";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        <Header time={time} onBack={() => router.push("/pos")} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Ładowanie pokoi hotelowych…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || apiError) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        <Header time={time} onBack={() => router.push("/pos")} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-lg font-medium text-destructive">
            {apiError || "Nie można połączyć z systemem hotelowym"}
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            Sprawdź konfigurację integracji hotelowej w ustawieniach systemu.
            Upewnij się, że HotelSystem jest uruchomiony i dostępny.
          </p>
          <Button onClick={() => refetch()} variant="outline">
            Spróbuj ponownie
          </Button>
        </div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        <Header time={time} onBack={() => router.push("/pos")} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <Hotel className="h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">Brak zajętych pokoi</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Obecnie żaden pokój hotelowy nie ma aktywnej rezerwacji.
            Zamówienia na pokój są możliwe tylko dla gości z aktywnym meldunkiem.
          </p>
          <Button onClick={() => router.push("/pos")} variant="outline">
            Powrót do POS
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <Header time={time} onBack={() => router.push("/pos")} />

      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Wybierz pokój</h2>
          <p className="text-sm text-muted-foreground">
            {rooms.length} {rooms.length === 1 ? "pokój" : rooms.length < 5 ? "pokoje" : "pokoi"} z aktywną rezerwacją
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {rooms
            .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }))
            .map((room) => (
              <button
                key={room.reservationId}
                onClick={() => handleRoomClick(room)}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-xl border-2 p-3 transition-all duration-150 active:scale-95 shadow-lg",
                  "min-h-[140px] sm:min-h-[150px]",
                  getRoomStatusColor(room.status)
                )}
              >
                {room.status === "CHECKED_IN" && (
                  <span className="absolute right-2 top-2">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                )}

                <span className="font-mono text-3xl font-black tabular-nums sm:text-4xl">
                  {room.roomNumber}
                </span>

                <div className="mt-2 flex flex-col items-center gap-0.5 text-center">
                  <span className="flex items-center gap-1 text-xs font-medium">
                    <User className="h-3 w-3" />
                    {room.guestName || "Gość"}
                  </span>
                  {room.pax && room.pax > 1 && (
                    <span className="flex items-center gap-1 text-[10px] opacity-80">
                      <Users className="h-3 w-3" />
                      {room.pax} os.
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[10px] opacity-70">
                    <Calendar className="h-3 w-3" />
                    do {formatDate(room.checkOut)}
                  </span>
                </div>

                {room.status && (
                  <span className="mt-1 text-[9px] font-medium uppercase tracking-wider opacity-60">
                    {room.status === "CHECKED_IN" ? "Zameldowany" : room.status === "CONFIRMED" ? "Potwierdzony" : room.status}
                  </span>
                )}
              </button>
            ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t bg-card px-4 py-3">
        <Button variant="outline" onClick={() => router.push("/pos")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Powrót
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentUser?.name}
        </span>
      </div>

      <Dialog open={!!selectedRoom} onOpenChange={(o) => !o && setSelectedRoom(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hotel className="h-5 w-5" />
              Pokój {selectedRoom?.roomNumber}
            </DialogTitle>
          </DialogHeader>

          {selectedRoom && (
            <div className="space-y-3 py-2">
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{selectedRoom.guestName || "Gość"}</p>
                    <p className="text-sm text-muted-foreground">
                      Wymeldowanie: {formatDate(selectedRoom.checkOut)}
                    </p>
                    {selectedRoom.pax && (
                      <p className="text-sm text-muted-foreground">
                        {selectedRoom.pax} {selectedRoom.pax === 1 ? "osoba" : selectedRoom.pax < 5 ? "osoby" : "osób"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Czy chcesz rozpocząć nowe zamówienie na ten pokój?
                Rachunek zostanie dopisany do rezerwacji gościa.
              </p>

              {createError && (
                <p className="text-sm text-destructive">{createError}</p>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSelectedRoom(null)}>
              Anuluj
            </Button>
            <Button
              onClick={handleStartOrder}
              disabled={creating}
              className="gap-2"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Tworzenie…
                </>
              ) : (
                "Rozpocznij zamówienie"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Header({ time, onBack }: { time: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 border-b bg-card px-3 py-2 sm:px-4">
      <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div className="relative h-8 w-10 shrink-0">
        <Image src="/logo.png" alt="Łabędź" fill className="object-contain object-left" unoptimized />
      </div>
      <div className="flex items-center gap-2">
        <Hotel className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold sm:text-base">Zamówienie na pokój</span>
      </div>
      <span className="flex-1" />
      <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
        {time}
      </span>
    </div>
  );
}
