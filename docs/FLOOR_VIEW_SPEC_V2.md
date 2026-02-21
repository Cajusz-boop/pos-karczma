# POS Karczma Łabędź — Specyfikacja Widoku Głównego (Floor Plan) V2
## Wersja dopasowana do istniejącej architektury + optymalizacje wydajności

---

## 1. PRIORYTET: WYDAJNOŚĆ

### 1.1 Zidentyfikowane problemy w obecnym kodzie

```typescript
// ❌ PROBLEM 1: processNoShows() na KAŻDYM GET /api/rooms
await processNoShows(prisma); // blokuje response!

// ❌ PROBLEM 2: Pobieranie WSZYSTKICH items żeby policzyć sumę
include: { items: true } // 50 stolików × 10 pozycji = 500 rows per request

// ❌ PROBLEM 3: Polling co 5 sekund z pełnym refresh
refetchInterval: 5_000 // 12 requestów/min × 500 rows = 6000 rows/min

// ❌ PROBLEM 4: Brak indeksów na często używanych kolumnach
// Order.status, Order.tableId, Table.roomId
```

### 1.2 Rozwiązania wydajnościowe

#### A. Przenieś processNoShows do CRON (nie na każdy request)
```typescript
// Zamiast wywoływać na każdym GET:
// Stwórz /api/cron/no-shows wywoływany co 5 minut przez Vercel Cron lub systemd timer
```

#### B. Agreguj sumę w bazie danych (nie w JS)
```sql
-- Dodaj kolumnę totalGross do Order (aktualizowana przy każdej zmianie items)
ALTER TABLE `Order` ADD COLUMN `totalGross` DECIMAL(10,2) DEFAULT 0;

-- Lub użyj Prisma computed field / view
```

#### C. Zamień polling na WebSocket dla zmian (nie full refresh)
```typescript
// Zamiast refetchInterval: 5000
// WebSocket broadcast tylko ZMIAN:
socket.emit('table:updated', { tableId, status, totalGross });
```

#### D. Dodaj indeksy w Prisma
```prisma
model Order {
  // ...
  @@index([tableId, status])
  @@index([status, createdAt])
}

model Table {
  // ...
  @@index([roomId, status])
}
```

#### E. Cache w pamięci (Redis lub Map)
```typescript
// Floor state cache - aktualizowany przez WebSocket/events
const floorCache = new Map<string, RoomState>();
// TTL: 30 sekund, invalidacja przy zmianach
```

---

## 2. ARCHITEKTURA TECHNICZNA (zgodna z projektem)

### 2.1 Stack (bez zmian)
- **Framework**: Next.js 14 App Router
- **State**: React Query (useQuery/useMutation) + Zustand tylko dla auth
- **Styling**: Tailwind CSS
- **ORM**: Prisma + MariaDB
- **Icons**: Lucide React
- **Realtime**: WebSocket (Socket.io) — DO DODANIA

### 2.2 Struktura plików (rozszerzenie istniejącej)

```
src/
├── app/
│   └── (dashboard)/
│       └── pos/
│           ├── page.tsx                    # (istnieje)
│           └── PosPageClient.tsx           # (istnieje - do refaktoru)
├── components/
│   └── pos/
│       ├── AlertBar.tsx                    # NOWY - pasek alertów
│       ├── TableCard.tsx                   # NOWY - wydzielony z PosPageClient
│       ├── TableDetailSheet.tsx            # NOWY - bottom sheet/panel
│       ├── QuickActionsMenu.tsx            # NOWY - zamiana context menu
│       ├── RoomTabs.tsx                    # NOWY - wydzielony z PosPageClient
│       ├── FloorStats.tsx                  # NOWY - statystyki sali
│       ├── SuggestionPopup.tsx             # (istnieje)
│       └── AllergenFilter.tsx              # (istnieje)
├── lib/
│   └── pos/
│       ├── constants.ts                    # NOWY - statusy, kolory, progi
│       ├── types.ts                        # NOWY - TypeScript types
│       └── utils.ts                        # NOWY - helpers (czas, formatowanie)
├── hooks/
│   └── pos/
│       ├── useFloorData.ts                 # NOWY - React Query wrapper z optymalizacjami
│       ├── usePosWebSocket.ts              # NOWY - realtime updates
│       ├── useLongPress.ts                 # NOWY - gesture hook
│       └── useTableTimers.ts               # NOWY - live timery (requestAnimationFrame)
└── store/
    └── useAuthStore.ts                     # (istnieje - bez zmian)
```

---

## 3. MODEL DANYCH (zgodny z Prisma)

### 3.1 Używaj ISTNIEJĄCYCH typów z Prisma

```typescript
// src/lib/pos/types.ts

import type { 
  Room, 
  Table, 
  Order, 
  OrderItem,
  Reservation,
  User,
  TableStatus,
  TableShape,
  OrderStatus,
  OrderItemStatus
} from "@prisma/client";

// ─── Rozszerzone typy dla widoku (computed fields) ─────────────────────

/** Stolik z danymi do wyświetlenia na mapie */
export interface TableView {
  id: string;                          // cuid z Prisma
  number: number;
  seats: number;
  shape: TableShape;                   // "RECTANGLE" | "ROUND" | "LONG"
  status: TableStatus;                 // "FREE" | "OCCUPIED" | "BILL_REQUESTED" | ...
  positionX: number;                   // 0-100 (%)
  positionY: number;                   // 0-100 (%)
  
  // Kelner (z User)
  assignedUserId: string | null;
  assignedUserName: string | null;
  assignedUserInitials: string | null;
  
  // Aktywne zamówienie (computed)
  activeOrder: {
    id: string;
    orderNumber: number;
    createdAt: Date;
    totalGross: number;                // NOWE: przechowywane w Order, nie liczone
    itemCount: number;                 // NOWE: COUNT z bazy
    guestCount: number;
    userId: string;
    userName: string;
  } | null;
  
  // Statusy kuchenne (computed z OrderItem)
  kitchenStatus: {
    ordered: number;                   // ile pozycji ORDERED/SENT
    inProgress: number;                // ile IN_PROGRESS
    ready: number;                     // ile READY (do odebrania!)
    served: number;                    // ile SERVED
  } | null;
  
  // Czasy (computed)
  timing: {
    minutesSinceCreated: number;
    minutesSinceLastInteraction: number;  // ostatnia zmiana w zamówieniu
    minutesSinceLastKitchenEvent: number; // ostatnie READY
  } | null;
  
  // Rezerwacja (następna)
  nextReservation: {
    id: string;
    timeFrom: string;                  // "18:00"
    guestName: string;
    guestCount: number;
    minutesUntil: number;              // countdown
    isVip: boolean;
  } | null;
  
  // Flagi
  needsAttention: boolean;             // NOWE: dodać do Table w Prisma
  hasKitchenAlert: boolean;            // computed: kitchenStatus.ready > 0
}

/** Sala z agregatami */
export interface RoomView {
  id: string;
  name: string;
  capacity: number;
  type: string;
  tables: TableView[];
  
  // Agregaty (computed w query)
  stats: {
    total: number;
    free: number;
    occupied: number;
    billRequested: number;
    reserved: number;
    withAlerts: number;                // ile ma kitchenStatus.ready > 0
    totalRevenue: number;              // suma totalGross aktywnych zamówień
  };
}

/** Alert do wyświetlenia w AlertBar */
export interface PosAlert {
  id: string;
  type: AlertType;
  tableId: string;
  tableNumber: number;
  roomId: string;
  message: string;
  createdAt: Date;
  priority: 1 | 2 | 3 | 4 | 5;         // 1 = najwyższy
  
  // Dla różnych typów
  orderId?: string;
  reservationId?: string;
  minutesWaiting?: number;
}

export type AlertType =
  | "KITCHEN_READY"                    // danie gotowe do odebrania
  | "LONG_WAIT"                        // stolik czeka >30 min
  | "RESERVATION_SOON"                 // rezerwacja za <30 min
  | "RESERVATION_CONFLICT"             // zajęty + rezerwacja blisko
  | "BILL_REQUESTED"                   // status BILL_REQUESTED
  | "NEEDS_ATTENTION";                 // ręczna flaga kelnera

// ─── Progi czasowe (konfigurowalne) ────────────────────────────────────

export interface TimeThresholds {
  warning: number;                     // minuty → żółty (default: 15)
  danger: number;                      // minuty → pomarańczowy (default: 30)
  critical: number;                    // minuty → czerwony (default: 45)
  reservationWarning: number;          // minuty przed rezerwacją → alert (default: 30)
}

export const DEFAULT_THRESHOLDS: TimeThresholds = {
  warning: 15,
  danger: 30,
  critical: 45,
  reservationWarning: 30,
};
```

### 3.2 Zmiany w Prisma Schema (minimalne)

```prisma
// Dodaj do schema.prisma:

model Table {
  // ... istniejące pola ...
  needsAttention  Boolean   @default(false)  // NOWE: flaga "wymaga uwagi"
  
  @@index([roomId, status])                  // NOWE: indeks
}

model Order {
  // ... istniejące pola ...
  totalGross      Decimal   @db.Decimal(10, 2) @default(0)  // NOWE: cached sum
  itemCount       Int       @default(0)                      // NOWE: cached count
  lastInteractionAt DateTime @default(now())                 // NOWE: ostatnia zmiana
  
  @@index([tableId, status])                 // NOWE: indeks
  @@index([status, createdAt])               // NOWE: indeks
}

model OrderItem {
  // ... istniejące pola ...
  
  @@index([orderId, status])                 // NOWE: indeks
}
```

---

## 4. DESIGN SYSTEM (dark theme dla POS)

### 4.1 CSS Custom Properties

```css
/* src/app/globals.css - dodaj sekcję POS */

/* ─── POS Dark Theme ─── */
.pos-theme {
  --pos-bg-primary: #0a0d14;
  --pos-bg-secondary: #0c0f18;
  --pos-bg-elevated: #111827;
  --pos-bg-hover: rgba(255,255,255,0.05);
  
  --pos-text-primary: #e2e8f0;
  --pos-text-secondary: #94a3b8;
  --pos-text-muted: #64748b;
  
  /* Statusy stolików */
  --pos-status-free: #22c55e;
  --pos-status-free-bg: rgba(34,197,94,0.08);
  --pos-status-free-border: rgba(34,197,94,0.25);
  
  --pos-status-occupied: #f59e0b;
  --pos-status-occupied-bg: rgba(245,158,11,0.10);
  --pos-status-occupied-border: rgba(245,158,11,0.4);
  
  --pos-status-bill: #ef4444;
  --pos-status-bill-bg: rgba(239,68,68,0.10);
  --pos-status-bill-border: rgba(239,68,68,0.4);
  
  --pos-status-reserved: #8b5cf6;
  --pos-status-reserved-bg: rgba(139,92,246,0.08);
  --pos-status-reserved-border: rgba(139,92,246,0.3);
  
  --pos-status-banquet: #3b82f6;
  --pos-status-banquet-bg: rgba(59,130,246,0.08);
  --pos-status-banquet-border: rgba(59,130,246,0.3);
  
  --pos-status-inactive: #475569;
  --pos-status-inactive-bg: rgba(71,85,105,0.08);
  --pos-status-inactive-border: rgba(71,85,105,0.2);
  
  /* Progi czasowe */
  --pos-time-ok: #22c55e;
  --pos-time-warning: #f59e0b;
  --pos-time-danger: #f97316;
  --pos-time-critical: #ef4444;
}
```

### 4.2 Mapowanie statusów (Prisma enum → kolory)

```typescript
// src/lib/pos/constants.ts

import type { TableStatus } from "@prisma/client";

export const STATUS_CONFIG: Record<TableStatus, {
  label: string;
  color: string;
  bg: string;
  border: string;
  tailwind: string;
}> = {
  FREE: {
    label: "Wolny",
    color: "var(--pos-status-free)",
    bg: "var(--pos-status-free-bg)",
    border: "var(--pos-status-free-border)",
    tailwind: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400",
  },
  OCCUPIED: {
    label: "Zajęty",
    color: "var(--pos-status-occupied)",
    bg: "var(--pos-status-occupied-bg)",
    border: "var(--pos-status-occupied-border)",
    tailwind: "bg-amber-500/10 border-amber-500/40 text-amber-400",
  },
  BILL_REQUESTED: {
    label: "Rachunek",
    color: "var(--pos-status-bill)",
    bg: "var(--pos-status-bill-bg)",
    border: "var(--pos-status-bill-border)",
    tailwind: "bg-rose-500/10 border-rose-500/40 text-rose-400 animate-pulse",
  },
  RESERVED: {
    label: "Rezerwacja",
    color: "var(--pos-status-reserved)",
    bg: "var(--pos-status-reserved-bg)",
    border: "var(--pos-status-reserved-border)",
    tailwind: "bg-violet-500/10 border-violet-500/40 text-violet-400",
  },
  BANQUET_MODE: {
    label: "Bankiet",
    color: "var(--pos-status-banquet)",
    bg: "var(--pos-status-banquet-bg)",
    border: "var(--pos-status-banquet-border)",
    tailwind: "bg-blue-500/10 border-blue-500/40 text-blue-400",
  },
  INACTIVE: {
    label: "Nieaktywny",
    color: "var(--pos-status-inactive)",
    bg: "var(--pos-status-inactive-bg)",
    border: "var(--pos-status-inactive-border)",
    tailwind: "bg-slate-500/10 border-slate-500/20 text-slate-500",
  },
};

/** Kolor czasu na podstawie minut */
export function getTimeColor(minutes: number, thresholds = DEFAULT_THRESHOLDS): string {
  if (minutes < thresholds.warning) return "text-emerald-400";
  if (minutes < thresholds.danger) return "text-amber-400";
  if (minutes < thresholds.critical) return "text-orange-400";
  return "text-rose-400 animate-pulse";
}

/** Inicjały z imienia i nazwiska */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
```

---

## 5. ZOPTYMALIZOWANE API

### 5.1 Nowy endpoint /api/pos/floor (zamiast /api/rooms)

```typescript
// src/app/api/pos/floor/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { differenceInMinutes } from "date-fns";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const start = performance.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId"); // opcjonalnie tylko jedna sala
    const userId = searchParams.get("userId"); // dla filtra "moje stoliki"
    
    const now = new Date();
    const today = new Date(now.toISOString().slice(0, 10));
    
    // Jeden query z wszystkimi danymi
    const rooms = await prisma.room.findMany({
      where: {
        isActive: true,
        ...(roomId && { id: roomId }),
      },
      select: {
        id: true,
        name: true,
        capacity: true,
        type: true,
        tables: {
          orderBy: { number: "asc" },
          select: {
            id: true,
            number: true,
            seats: true,
            shape: true,
            status: true,
            positionX: true,
            positionY: true,
            assignedUser: true,
            needsAttention: true,
            orders: {
              where: {
                status: { notIn: ["CLOSED", "CANCELLED"] },
              },
              take: 1,
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                orderNumber: true,
                createdAt: true,
                guestCount: true,
                totalGross: true,      // cached!
                itemCount: true,       // cached!
                lastInteractionAt: true,
                userId: true,
                user: { select: { name: true } },
                items: {
                  select: {
                    status: true,
                    readyAt: true,
                  },
                },
              },
            },
            reservations: {
              where: {
                date: today,
                status: { in: ["PENDING", "CONFIRMED"] },
              },
              take: 1,
              orderBy: { timeFrom: "asc" },
              select: {
                id: true,
                timeFrom: true,
                guestName: true,
                guestCount: true,
                notes: true,
              },
            },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });
    
    // Transform do widoku
    const result = rooms.map((room) => {
      let free = 0, occupied = 0, billRequested = 0, reserved = 0, withAlerts = 0;
      let totalRevenue = 0;
      
      const tables = room.tables.map((t) => {
        const order = t.orders[0];
        const reservation = t.reservations[0];
        
        // Liczniki statusów
        if (t.status === "FREE") free++;
        else if (t.status === "OCCUPIED") occupied++;
        else if (t.status === "BILL_REQUESTED") billRequested++;
        else if (t.status === "RESERVED") reserved++;
        
        // Kitchen status z items
        let kitchenStatus = null;
        let hasKitchenAlert = false;
        if (order?.items?.length) {
          const counts = { ordered: 0, inProgress: 0, ready: 0, served: 0 };
          for (const item of order.items) {
            if (item.status === "ORDERED" || item.status === "SENT") counts.ordered++;
            else if (item.status === "IN_PROGRESS") counts.inProgress++;
            else if (item.status === "READY") counts.ready++;
            else if (item.status === "SERVED") counts.served++;
          }
          kitchenStatus = counts;
          hasKitchenAlert = counts.ready > 0;
          if (hasKitchenAlert) withAlerts++;
        }
        
        // Revenue
        if (order) {
          totalRevenue += Number(order.totalGross);
        }
        
        // Timing
        let timing = null;
        if (order) {
          const createdAt = new Date(order.createdAt);
          const lastInteraction = new Date(order.lastInteractionAt);
          const lastKitchenEvent = order.items
            ?.filter((i) => i.readyAt)
            .map((i) => new Date(i.readyAt!))
            .sort((a, b) => b.getTime() - a.getTime())[0];
          
          timing = {
            minutesSinceCreated: differenceInMinutes(now, createdAt),
            minutesSinceLastInteraction: differenceInMinutes(now, lastInteraction),
            minutesSinceLastKitchenEvent: lastKitchenEvent
              ? differenceInMinutes(now, lastKitchenEvent)
              : null,
          };
        }
        
        // Rezerwacja
        let nextReservation = null;
        if (reservation) {
          const resTime = new Date(reservation.timeFrom);
          nextReservation = {
            id: reservation.id,
            timeFrom: resTime.toTimeString().slice(0, 5),
            guestName: reservation.guestName,
            guestCount: reservation.guestCount,
            minutesUntil: differenceInMinutes(resTime, now),
            isVip: reservation.notes?.toLowerCase().includes("vip") ?? false,
          };
        }
        
        // Kelner
        let assignedUserName = null;
        let assignedUserInitials = null;
        if (order?.user?.name) {
          assignedUserName = order.user.name;
          assignedUserInitials = order.user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
        }
        
        return {
          id: t.id,
          number: t.number,
          seats: t.seats,
          shape: t.shape,
          status: t.status,
          positionX: t.positionX,
          positionY: t.positionY,
          assignedUserId: order?.userId ?? null,
          assignedUserName,
          assignedUserInitials,
          activeOrder: order
            ? {
                id: order.id,
                orderNumber: order.orderNumber,
                createdAt: order.createdAt,
                totalGross: Number(order.totalGross),
                itemCount: order.itemCount,
                guestCount: order.guestCount,
                userId: order.userId,
                userName: order.user.name,
              }
            : null,
          kitchenStatus,
          timing,
          nextReservation,
          needsAttention: t.needsAttention,
          hasKitchenAlert,
        };
      });
      
      return {
        id: room.id,
        name: room.name,
        capacity: room.capacity,
        type: room.type,
        tables,
        stats: {
          total: tables.length,
          free,
          occupied,
          billRequested,
          reserved,
          withAlerts,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
        },
      };
    });
    
    const elapsed = Math.round(performance.now() - start);
    
    return NextResponse.json({
      rooms: result,
      meta: {
        timestamp: now.toISOString(),
        queryTimeMs: elapsed,
      },
    });
  } catch (e) {
    console.error("[Floor API]", e);
    return NextResponse.json({ error: "Błąd pobierania mapy" }, { status: 500 });
  }
}
```

### 5.2 Endpoint alertów /api/pos/alerts

```typescript
// src/app/api/pos/alerts/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { differenceInMinutes } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const roomId = searchParams.get("roomId");
    
    const now = new Date();
    const today = new Date(now.toISOString().slice(0, 10));
    const alerts: Array<{
      id: string;
      type: string;
      tableId: string;
      tableNumber: number;
      roomId: string;
      message: string;
      createdAt: Date;
      priority: number;
    }> = [];
    
    // 1. Kitchen ready alerts
    const readyItems = await prisma.orderItem.findMany({
      where: {
        status: "READY",
        order: {
          status: { notIn: ["CLOSED", "CANCELLED"] },
          ...(userId && { userId }),
        },
      },
      select: {
        id: true,
        readyAt: true,
        order: {
          select: {
            id: true,
            table: {
              select: { id: true, number: true, roomId: true },
            },
          },
        },
      },
    });
    
    // Grupuj po stoliku
    const readyByTable = new Map<string, { count: number; oldest: Date }>();
    for (const item of readyItems) {
      if (!item.order.table) continue;
      const tableId = item.order.table.id;
      const existing = readyByTable.get(tableId);
      const readyAt = item.readyAt ?? now;
      if (!existing) {
        readyByTable.set(tableId, { count: 1, oldest: readyAt });
      } else {
        existing.count++;
        if (readyAt < existing.oldest) existing.oldest = readyAt;
      }
    }
    
    for (const item of readyItems) {
      if (!item.order.table) continue;
      const table = item.order.table;
      const data = readyByTable.get(table.id)!;
      
      // Tylko jeden alert per stolik
      if (alerts.find((a) => a.tableId === table.id && a.type === "KITCHEN_READY")) continue;
      
      const mins = differenceInMinutes(now, data.oldest);
      alerts.push({
        id: `kitchen-${table.id}`,
        type: "KITCHEN_READY",
        tableId: table.id,
        tableNumber: table.number,
        roomId: table.roomId,
        message: `Stolik ${table.number} — ${data.count} ${data.count === 1 ? "danie gotowe" : "dania gotowe"} (${mins} min)`,
        createdAt: data.oldest,
        priority: 1,
      });
    }
    
    // 2. Bill requested
    const billTables = await prisma.table.findMany({
      where: {
        status: "BILL_REQUESTED",
        ...(roomId && { roomId }),
      },
      select: {
        id: true,
        number: true,
        roomId: true,
        orders: {
          where: { status: "BILL_REQUESTED" },
          take: 1,
          select: { createdAt: true },
        },
      },
    });
    
    for (const table of billTables) {
      const mins = table.orders[0]
        ? differenceInMinutes(now, table.orders[0].createdAt)
        : 0;
      alerts.push({
        id: `bill-${table.id}`,
        type: "BILL_REQUESTED",
        tableId: table.id,
        tableNumber: table.number,
        roomId: table.roomId,
        message: `Stolik ${table.number} — rachunek (${mins} min)`,
        createdAt: table.orders[0]?.createdAt ?? now,
        priority: 3,
      });
    }
    
    // 3. Reservation conflicts
    const occupiedWithReservation = await prisma.table.findMany({
      where: {
        status: "OCCUPIED",
        reservations: {
          some: {
            date: today,
            status: { in: ["PENDING", "CONFIRMED"] },
            timeFrom: {
              lte: new Date(now.getTime() + 30 * 60 * 1000), // za max 30 min
              gte: now,
            },
          },
        },
      },
      select: {
        id: true,
        number: true,
        roomId: true,
        reservations: {
          where: {
            date: today,
            status: { in: ["PENDING", "CONFIRMED"] },
          },
          take: 1,
          select: { timeFrom: true, guestName: true },
        },
      },
    });
    
    for (const table of occupiedWithReservation) {
      const res = table.reservations[0];
      if (!res) continue;
      const mins = differenceInMinutes(res.timeFrom, now);
      alerts.push({
        id: `conflict-${table.id}`,
        type: "RESERVATION_CONFLICT",
        tableId: table.id,
        tableNumber: table.number,
        roomId: table.roomId,
        message: `⚠️ Stolik ${table.number} zajęty — rez. ${res.guestName} za ${mins} min!`,
        createdAt: now,
        priority: 2,
      });
    }
    
    // Sortuj po priorytecie
    alerts.sort((a, b) => a.priority - b.priority);
    
    return NextResponse.json({ alerts });
  } catch (e) {
    console.error("[Alerts API]", e);
    return NextResponse.json({ error: "Błąd alertów" }, { status: 500 });
  }
}
```

---

## 6. REACT QUERY HOOKS (zoptymalizowane)

### 6.1 useFloorData — główny hook

```typescript
// src/hooks/pos/useFloorData.ts

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { RoomView, PosAlert } from "@/lib/pos/types";

interface FloorResponse {
  rooms: RoomView[];
  meta: {
    timestamp: string;
    queryTimeMs: number;
  };
}

interface AlertsResponse {
  alerts: PosAlert[];
}

export function useFloorData(options?: {
  roomId?: string;
  userId?: string;
  enabled?: boolean;
}) {
  const { roomId, userId, enabled = true } = options ?? {};
  
  return useQuery<FloorResponse>({
    queryKey: ["floor", { roomId, userId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (roomId) params.set("roomId", roomId);
      if (userId) params.set("userId", userId);
      
      const res = await fetch(`/api/pos/floor?${params}`);
      if (!res.ok) throw new Error("Błąd pobierania mapy");
      return res.json();
    },
    enabled,
    staleTime: 3_000,          // 3s świeże dane
    refetchInterval: 5_000,    // polling co 5s (do zamiany na WebSocket)
    refetchOnWindowFocus: true,
  });
}

export function useAlerts(options?: {
  roomId?: string;
  userId?: string;
  enabled?: boolean;
}) {
  const { roomId, userId, enabled = true } = options ?? {};
  
  return useQuery<AlertsResponse>({
    queryKey: ["alerts", { roomId, userId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (roomId) params.set("roomId", roomId);
      if (userId) params.set("userId", userId);
      
      const res = await fetch(`/api/pos/alerts?${params}`);
      if (!res.ok) throw new Error("Błąd alertów");
      return res.json();
    },
    enabled,
    staleTime: 2_000,
    refetchInterval: 3_000,    // alerty częściej
  });
}

/** Invalidacja po akcjach */
export function useFloorInvalidation() {
  const queryClient = useQueryClient();
  
  return {
    invalidateFloor: () => {
      queryClient.invalidateQueries({ queryKey: ["floor"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
    invalidateTable: (tableId: string) => {
      queryClient.invalidateQueries({ queryKey: ["floor"] });
    },
  };
}
```

### 6.2 useTableTimers — live timery bez re-renderów

```typescript
// src/hooks/pos/useTableTimers.ts

import { useEffect, useRef, useState } from "react";

/**
 * Hook do live timerów na stolikach.
 * Używa requestAnimationFrame zamiast setInterval dla wydajności.
 * Aktualizuje tylko gdy wartość się zmieni (co minutę).
 */
export function useTableTimers(tables: Array<{ id: string; createdAt: Date | null }>) {
  const [timers, setTimers] = useState<Map<string, number>>(new Map());
  const rafRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);
  
  useEffect(() => {
    const UPDATE_INTERVAL = 30_000; // aktualizuj co 30s
    
    const tick = (timestamp: number) => {
      if (timestamp - lastUpdateRef.current >= UPDATE_INTERVAL) {
        lastUpdateRef.current = timestamp;
        
        const now = Date.now();
        const newTimers = new Map<string, number>();
        
        for (const table of tables) {
          if (table.createdAt) {
            const minutes = Math.floor((now - new Date(table.createdAt).getTime()) / 60_000);
            newTimers.set(table.id, minutes);
          }
        }
        
        setTimers(newTimers);
      }
      
      rafRef.current = requestAnimationFrame(tick);
    };
    
    // Initial
    const now = Date.now();
    const initial = new Map<string, number>();
    for (const table of tables) {
      if (table.createdAt) {
        initial.set(table.id, Math.floor((now - new Date(table.createdAt).getTime()) / 60_000));
      }
    }
    setTimers(initial);
    
    rafRef.current = requestAnimationFrame(tick);
    
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [tables]);
  
  return timers;
}
```

---

## 7. KOMPONENTY (wydzielone)

### 7.1 TableCard (zoptymalizowany)

```typescript
// src/components/pos/TableCard.tsx

"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { Users, Clock, AlertTriangle, BellRing } from "lucide-react";
import { STATUS_CONFIG, getTimeColor, getInitials } from "@/lib/pos/constants";
import type { TableView } from "@/lib/pos/types";

interface TableCardProps {
  table: TableView;
  onClick: () => void;
  onLongPress?: () => void;
  showWaiter?: boolean;
  dimmed?: boolean;
}

export const TableCard = memo(function TableCard({
  table,
  onClick,
  onLongPress,
  showWaiter = true,
  dimmed = false,
}: TableCardProps) {
  const config = STATUS_CONFIG[table.status];
  const hasOrder = !!table.activeOrder;
  const hasReservation = !hasOrder && !!table.nextReservation;
  
  // Long press handling
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!onLongPress) return;
    const timer = setTimeout(() => onLongPress(), 500);
    const cleanup = () => clearTimeout(timer);
    e.currentTarget.addEventListener("pointerup", cleanup, { once: true });
    e.currentTarget.addEventListener("pointerleave", cleanup, { once: true });
  };
  
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={handlePointerDown}
      disabled={table.status === "INACTIVE"}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl border-2 p-2 transition-all duration-150",
        "min-h-[120px] md:min-h-[140px]",
        "active:scale-95",
        config.tailwind,
        table.shape === "ROUND" && "rounded-full aspect-square min-h-0",
        dimmed && "opacity-20 pointer-events-none",
      )}
    >
      {/* Kelner badge */}
      {showWaiter && table.assignedUserInitials && (
        <span className="absolute left-2 top-2 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-bold">
          {table.assignedUserInitials}
        </span>
      )}
      
      {/* Kitchen alert */}
      {table.hasKitchenAlert && (
        <span className="absolute right-2 top-2">
          <BellRing className="h-4 w-4 text-rose-400 animate-bounce" />
        </span>
      )}
      
      {/* Needs attention */}
      {table.needsAttention && !table.hasKitchenAlert && (
        <span className="absolute right-2 top-2">
          <AlertTriangle className="h-4 w-4 text-amber-400 animate-pulse" />
        </span>
      )}
      
      {/* Numer stolika */}
      <span className={cn(
        "font-mono font-black tabular-nums leading-none",
        hasOrder ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl opacity-80"
      )}>
        {table.number}
      </span>
      
      {/* Miejsca */}
      <span className="mt-1 flex items-center gap-1 text-[11px] opacity-70">
        <Users className="h-3 w-3" />
        {table.seats}
      </span>
      
      {/* Zajęty: kwota + czas */}
      {hasOrder && (
        <div className="mt-1.5 flex flex-col items-center gap-0.5">
          <span className="font-mono text-base font-bold tabular-nums md:text-lg">
            {table.activeOrder!.totalGross.toFixed(2)} zł
          </span>
          {table.timing && (
            <span className={cn(
              "flex items-center gap-1 text-[10px] font-medium",
              getTimeColor(table.timing.minutesSinceLastInteraction)
            )}>
              <Clock className="h-3 w-3" />
              {table.timing.minutesSinceLastInteraction}'
            </span>
          )}
          
          {/* Progress bar pozycji */}
          {table.kitchenStatus && (
            <div className="mt-1 flex h-1 w-16 gap-0.5 overflow-hidden rounded-full">
              {table.kitchenStatus.served > 0 && (
                <div
                  className="bg-emerald-400"
                  style={{ flex: table.kitchenStatus.served }}
                />
              )}
              {table.kitchenStatus.ready > 0 && (
                <div
                  className="bg-rose-400 animate-pulse"
                  style={{ flex: table.kitchenStatus.ready }}
                />
              )}
              {table.kitchenStatus.inProgress > 0 && (
                <div
                  className="bg-amber-400"
                  style={{ flex: table.kitchenStatus.inProgress }}
                />
              )}
              {table.kitchenStatus.ordered > 0 && (
                <div
                  className="bg-slate-500"
                  style={{ flex: table.kitchenStatus.ordered }}
                />
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Rezerwacja */}
      {hasReservation && (
        <div className="mt-1.5 flex flex-col items-center gap-0.5">
          <span className="text-xs font-semibold">
            {table.nextReservation!.timeFrom}
          </span>
          <span className="text-[10px] opacity-80">
            {table.nextReservation!.guestName}
          </span>
        </div>
      )}
      
      {/* Wolny */}
      {!hasOrder && !hasReservation && table.status === "FREE" && (
        <span className="mt-1 text-[10px] font-medium uppercase tracking-wider opacity-50">
          {config.label}
        </span>
      )}
    </button>
  );
});
```

### 7.2 AlertBar

```typescript
// src/components/pos/AlertBar.tsx

"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { BellRing, Clock, CalendarClock, AlertTriangle, Receipt, X } from "lucide-react";
import type { PosAlert, AlertType } from "@/lib/pos/types";

const ALERT_CONFIG: Record<AlertType, {
  icon: typeof BellRing;
  bgClass: string;
  textClass: string;
}> = {
  KITCHEN_READY: {
    icon: BellRing,
    bgClass: "bg-rose-500/15",
    textClass: "text-rose-400",
  },
  RESERVATION_CONFLICT: {
    icon: AlertTriangle,
    bgClass: "bg-rose-500/15",
    textClass: "text-rose-400",
  },
  BILL_REQUESTED: {
    icon: Receipt,
    bgClass: "bg-amber-500/15",
    textClass: "text-amber-400",
  },
  LONG_WAIT: {
    icon: Clock,
    bgClass: "bg-amber-500/15",
    textClass: "text-amber-400",
  },
  RESERVATION_SOON: {
    icon: CalendarClock,
    bgClass: "bg-violet-500/15",
    textClass: "text-violet-400",
  },
  NEEDS_ATTENTION: {
    icon: AlertTriangle,
    bgClass: "bg-amber-500/15",
    textClass: "text-amber-400",
  },
};

interface AlertBarProps {
  alerts: PosAlert[];
  onAlertClick?: (alert: PosAlert) => void;
  onDismiss?: (alertId: string) => void;
}

export const AlertBar = memo(function AlertBar({
  alerts,
  onAlertClick,
  onDismiss,
}: AlertBarProps) {
  if (alerts.length === 0) return null;
  
  return (
    <div className="flex h-11 items-center gap-2 overflow-x-auto border-b border-white/5 bg-black/20 px-3">
      {alerts.map((alert) => {
        const config = ALERT_CONFIG[alert.type as AlertType];
        const Icon = config?.icon ?? AlertTriangle;
        
        return (
          <button
            key={alert.id}
            onClick={() => onAlertClick?.(alert)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors",
              config?.bgClass ?? "bg-slate-500/15",
              config?.textClass ?? "text-slate-400",
              "hover:brightness-125"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">{alert.message}</span>
            {onDismiss && (
              <X
                className="h-3.5 w-3.5 opacity-50 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(alert.id);
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
});
```

---

## 8. PLAN IMPLEMENTACJI (fazy)

### Faza 1: Optymalizacja wydajności (PRIORYTET)
1. [ ] Dodaj indeksy do Prisma schema
2. [ ] Dodaj `totalGross`, `itemCount`, `lastInteractionAt` do Order
3. [ ] Przenieś `processNoShows` do CRON
4. [ ] Stwórz `/api/pos/floor` i `/api/pos/alerts`
5. [ ] Trigger aktualizujący totalGross przy zmianach items

### Faza 2: Komponenty UI
1. [ ] Wydziel `TableCard` z `PosPageClient`
2. [ ] Stwórz `AlertBar`
3. [ ] Dodaj dark theme CSS variables
4. [ ] Dodaj progresywne kolory czasowe

### Faza 3: Funkcjonalności
1. [ ] Filtr "Moje stoliki"
2. [ ] Flaga `needsAttention` (swipe right)
3. [ ] Progress bar pozycji na stoliku
4. [ ] Inicjały kelnera na stoliku

### Faza 4: WebSocket (zamiana pollingu)
1. [ ] Setup Socket.io server
2. [ ] Hook `usePosWebSocket`
3. [ ] Broadcast zmian przy mutacjach
4. [ ] Usunięcie `refetchInterval`

---

## 9. BENCHMARKI DOCELOWE

| Metryka | Obecna | Cel |
|---------|--------|-----|
| `/api/rooms` response time | ~200-500ms | <100ms |
| Rows per request | ~500 | <50 |
| Requests/min (polling) | 12 | 0 (WebSocket) |
| Re-renders on update | full page | single table |
| First Contentful Paint | ~1.5s | <0.8s |

---

*Specyfikacja V2 — Luty 2026*
*Zgodna z istniejącym Prisma schema + optymalizacje wydajności*
