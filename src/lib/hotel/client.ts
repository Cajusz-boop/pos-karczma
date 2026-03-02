/**
 * Hotel System API Client
 * Integrates with C:\HotelSystem (same stack: Next.js + Prisma + MariaDB)
 *
 * Endpoints:
 * - GET /api/v1/external/occupied-rooms — list occupied hotel rooms with guest info
 * - POST /api/v1/external/posting — post a restaurant charge to a hotel room
 * - GET /api/breakfast/guests — list guests with breakfast included
 */

import { prisma } from "@/lib/prisma";

export interface HotelRoom {
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

export interface RoomChargeItem {
  name: string;
  quantity: number;
  unitPrice: number;
  category?: string;
}

export interface RoomCharge {
  id: string;
  roomNumber: string;
  amount: number;
  description: string;
  orderId: string;
  status: "PENDING" | "POSTED" | "FAILED";
  unassigned?: boolean;
  unassignedChargeId?: string;
  reason?: string;
}

export interface HotelConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
}

const DEFAULT_CONFIG: HotelConfig = {
  enabled: false,
  baseUrl: "http://localhost:3011",
  apiKey: "",
};

const HOTEL_TIMEOUT_MS = 10000;

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = HOTEL_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

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
    const response = await fetchWithTimeout(
      `${config.baseUrl}/api/v1/external/occupied-rooms`,
      {
        headers: {
          "X-API-Key": config.apiKey,
          Authorization: `Bearer ${config.apiKey}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return { rooms: [], error: `Błąd API hotelu: ${response.status}` };
    }

    const data = await response.json();
    return {
      rooms: (data.rooms ?? data ?? []).map((r: Record<string, unknown>) => {
        const guest = r.guest as Record<string, unknown> | undefined;
        return {
          roomNumber: String(r.roomNumber ?? r.number ?? ""),
          roomType: r.roomType ? String(r.roomType) : undefined,
          guestName: String(r.guestName ?? guest?.name ?? ""),
          guestId: String(r.guestId ?? guest?.id ?? ""),
          checkIn: String(r.checkIn ?? ""),
          checkOut: String(r.checkOut ?? ""),
          reservationId: String(r.reservationId ?? r.id ?? ""),
          pax: typeof r.pax === "number" ? r.pax : undefined,
          status: r.status ? String(r.status) : undefined,
        };
      }),
    };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      return { rooms: [], error: "Przekroczono czas oczekiwania na hotel" };
    }
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
  items?: RoomChargeItem[];
  cashierName?: string;
  reservationId?: string;
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
    const response = await fetchWithTimeout(
      `${config.baseUrl}/api/v1/external/posting`,
      {
        method: "POST",
        headers: {
          "X-API-Key": config.apiKey,
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomNumber: params.roomNumber,
          amount: params.amount,
          type: "RESTAURANT",
          description: params.description,
          posSystem: "POS-Karczma",
          receiptNumber: `ZAM/${params.orderNumber}`,
          items: params.items,
          cashierName: params.cashierName,
          reservationId: params.reservationId,
        }),
      }
    );

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
    
    // Handle unassigned charge response
    if (data.unassigned) {
      return {
        id: data.unassignedChargeId ?? "",
        roomNumber: params.roomNumber,
        amount: params.amount,
        description: params.description,
        orderId: params.orderId,
        status: "POSTED",
        unassigned: true,
        unassignedChargeId: data.unassignedChargeId,
        reason: data.reason,
      };
    }

    return {
      id: data.transactionId ?? data.id ?? "",
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
    const response = await fetchWithTimeout(
      `${config.baseUrl}/api/breakfast/guests`,
      {
        headers: {
          "X-API-Key": config.apiKey,
          Authorization: `Bearer ${config.apiKey}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

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
    if (e instanceof Error && e.name === "AbortError") {
      return { guests: [], error: "Przekroczono czas oczekiwania na hotel" };
    }
    return {
      guests: [],
      error: e instanceof Error ? e.message : "Błąd połączenia z hotelem",
    };
  }
}
