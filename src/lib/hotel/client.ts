/**
 * Hotel System API Client
 * Integrates with C:\HotelSystem (same stack: Next.js + Prisma + MariaDB)
 *
 * Endpoints:
 * - GET /api/rooms/occupied — list occupied hotel rooms with guest info
 * - POST /api/room-charges — post a restaurant charge to a hotel room
 * - GET /api/breakfast/guests — list guests with breakfast included
 */

import { prisma } from "@/lib/prisma";

export interface HotelRoom {
  roomNumber: string;
  guestName: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  reservationId: string;
}

export interface BreakfastGuest {
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

export interface RoomCharge {
  id: string;
  roomNumber: string;
  amount: number;
  description: string;
  orderId: string;
  status: "PENDING" | "POSTED" | "FAILED";
}

export interface HotelConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
}

const DEFAULT_CONFIG: HotelConfig = {
  enabled: false,
  baseUrl: "http://localhost:3001",
  apiKey: "",
};

async function getConfig(): Promise<HotelConfig> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: "hotel_integration" },
    });
    if (config?.value && typeof config.value === "object") {
      return { ...DEFAULT_CONFIG, ...(config.value as object) } as HotelConfig;
    }
  } catch (e) {
    console.error("[Hotel] Error reading config:", e);
  }
  return DEFAULT_CONFIG;
}

/**
 * Get list of currently occupied hotel rooms.
 */
export async function getOccupiedRooms(): Promise<{
  rooms: HotelRoom[];
  error?: string;
}> {
  const config = await getConfig();
  if (!config.enabled) {
    return { rooms: [], error: "Integracja hotelowa wyłączona" };
  }

  try {
    const response = await fetch(`${config.baseUrl}/api/rooms/occupied`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return { rooms: [], error: `Błąd API hotelu: ${response.status}` };
    }

    const data = await response.json();
    return {
      rooms: (data.rooms ?? data ?? []).map((r: Record<string, unknown>) => {
        const guest = r.guest as Record<string, unknown> | undefined;
        return {
          roomNumber: String(r.roomNumber ?? r.number ?? ""),
          guestName: String(r.guestName ?? guest?.name ?? ""),
          guestId: String(r.guestId ?? guest?.id ?? ""),
          checkIn: String(r.checkIn ?? ""),
          checkOut: String(r.checkOut ?? ""),
          reservationId: String(r.reservationId ?? r.id ?? ""),
        };
      }),
    };
  } catch (e) {
    return {
      rooms: [],
      error: e instanceof Error ? e.message : "Błąd połączenia z hotelem",
    };
  }
}

/**
 * Post a restaurant charge to a hotel room.
 */
export async function postRoomCharge(params: {
  roomNumber: string;
  amount: number;
  description: string;
  orderId: string;
  orderNumber: number;
}): Promise<RoomCharge> {
  const config = await getConfig();
  if (!config.enabled) {
    return {
      id: "",
      roomNumber: params.roomNumber,
      amount: params.amount,
      description: params.description,
      orderId: params.orderId,
      status: "FAILED",
    };
  }

  try {
    const response = await fetch(`${config.baseUrl}/api/room-charges`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roomNumber: params.roomNumber,
        amount: params.amount,
        currency: "PLN",
        description: params.description,
        source: "POS_RESTAURANT",
        sourceRef: params.orderId,
        sourceOrderNumber: params.orderNumber,
      }),
    });

    if (!response.ok) {
      return {
        id: "",
        roomNumber: params.roomNumber,
        amount: params.amount,
        description: params.description,
        orderId: params.orderId,
        status: "FAILED",
      };
    }

    const data = await response.json();
    return {
      id: data.id ?? "",
      roomNumber: params.roomNumber,
      amount: params.amount,
      description: params.description,
      orderId: params.orderId,
      status: "POSTED",
    };
  } catch {
    return {
      id: "",
      roomNumber: params.roomNumber,
      amount: params.amount,
      description: params.description,
      orderId: params.orderId,
      status: "FAILED",
    };
  }
}

/**
 * Get list of hotel guests with breakfast included for today.
 * Falls back to occupied rooms if hotel doesn't have a breakfast endpoint.
 */
export async function getBreakfastGuests(): Promise<{
  guests: BreakfastGuest[];
  error?: string;
}> {
  const config = await getConfig();
  if (!config.enabled) {
    return { guests: [], error: "Integracja hotelowa wyłączona" };
  }

  try {
    // Try dedicated breakfast endpoint first
    const response = await fetch(`${config.baseUrl}/api/breakfast/guests`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json();
      return {
        guests: (data.guests ?? data ?? []).map((g: Record<string, unknown>) => ({
          roomNumber: String(g.roomNumber ?? ""),
          guestName: String(g.guestName ?? g.name ?? ""),
          guestId: String(g.guestId ?? g.id ?? ""),
          guestCount: Number(g.guestCount ?? g.pax ?? 1),
          mealPlan: String(g.mealPlan ?? "BB"),
          preferences: Array.isArray(g.preferences) ? g.preferences.map(String) : [],
          allergens: Array.isArray(g.allergens) ? g.allergens.map(String) : [],
          checkOut: String(g.checkOut ?? ""),
          served: Boolean(g.served ?? false),
          servedAt: g.servedAt ? String(g.servedAt) : undefined,
        })),
      };
    }

    // Fallback: derive from occupied rooms
    const roomsResult = await getOccupiedRooms();
    if (roomsResult.error) {
      return { guests: [], error: roomsResult.error };
    }

    return {
      guests: roomsResult.rooms.map((r) => ({
        roomNumber: r.roomNumber,
        guestName: r.guestName,
        guestId: r.guestId,
        guestCount: 1,
        mealPlan: "BB",
        preferences: [],
        allergens: [],
        checkOut: r.checkOut,
        served: false,
      })),
    };
  } catch (e) {
    return {
      guests: [],
      error: e instanceof Error ? e.message : "Błąd połączenia z hotelem",
    };
  }
}
