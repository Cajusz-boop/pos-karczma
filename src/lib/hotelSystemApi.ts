/**
 * HotelSystem API — imprezy dla kalkulatora zapotrzebowania (Faza 2).
 * Dane imprez pobierane z HotelSystem przez HTTP zamiast lokalnej bazy.
 */

export interface EventOrderFromHotel {
  id: string;
  name: string;
  eventType: string;
  dateFrom: string;
  dateTo: string;
  guestCount: number;
  packageId: number | null;
  status: string;
}

const TIMEOUT_MS = 10000;

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function parseEventOrder(raw: Record<string, unknown>): EventOrderFromHotel {
  const pkgId = raw.packageId ?? raw.package_id;
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    eventType: String(raw.eventType ?? ""),
    dateFrom: String(raw.dateFrom ?? raw.date_from ?? ""),
    dateTo: String(raw.dateTo ?? raw.date_to ?? ""),
    guestCount: typeof raw.guestCount === "number" ? raw.guestCount : typeof raw.guest_count === "number" ? raw.guest_count : 0,
    packageId: typeof pkgId === "number" ? pkgId : typeof pkgId === "string" && pkgId !== "" ? parseInt(pkgId, 10) : null,
    status: String(raw.status ?? ""),
  };
}

/**
 * Pobiera nadchodzące imprezy (event-orders) z HotelSystem.
 * Używane przez kalkulator zapotrzebowania.
 * W przypadku błędów (timeout, 4xx, 5xx) zwraca [] i loguje błąd — kalkulator nie crashuje.
 */
export async function getUpcomingEventOrders(): Promise<EventOrderFromHotel[]> {
  const baseUrl = process.env.HOTEL_SYSTEM_URL?.trim();
  const apiKey = process.env.HOTEL_SYSTEM_API_KEY?.trim();

  if (!baseUrl) {
    console.warn("[HotelSystemApi] HOTEL_SYSTEM_URL nie jest ustawione — zwracam pustą listę");
    return [];
  }

  const url = `${baseUrl.replace(/\/$/, "")}/api/event-orders?status=CONFIRMED&upcoming=true`;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
    headers["X-API-Key"] = apiKey;
  }

  try {
    const res = await fetchWithTimeout(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(
        `[HotelSystemApi] Błąd ${res.status} od HotelSystem: ${res.statusText}`
      );
      return [];
    }

    const data = await res.json();
    const items = Array.isArray(data) ? data : data.items ?? data.data ?? [];
    return items.map((item: Record<string, unknown>) => parseEventOrder(item));
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      console.error("[HotelSystemApi] Timeout połączenia z HotelSystem");
    } else {
      console.error("[HotelSystemApi] Błąd pobierania imprez:", e);
    }
    return [];
  }
}
