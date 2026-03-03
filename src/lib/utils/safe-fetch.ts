const RETRY_STATUS = [502, 503, 504];
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

function humanError(status: number): string {
  switch (status) {
    case 401:
      return "Sesja wygasła — zaloguj się ponownie";
    case 502:
      return "Serwer tymczasowo niedostępny (502) — spróbuj za chwilę";
    case 503:
      return "Serwer przeciążony (503) — spróbuj za chwilę";
    case 504:
      return "Serwer nie odpowiada (504) — sprawdź połączenie";
    default:
      return `HTTP ${status}`;
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export interface SafeFetchOptions {
  /** Timeout w ms (domyślnie 10000). Dla sync użyj 30000+ na wolniejszym serwerze. */
  timeoutMs?: number;
}

/**
 * Safe fetch — unika crashu gdy serwer zwraca HTML zamiast JSON (offline, 502, error page).
 * Retry przy 502/503/504. Zawsze parsuj text() przed JSON.parse() z try/catch.
 */
export async function safeFetch<T = unknown>(
  url: string,
  options?: RequestInit,
  fetchOpts?: SafeFetchOptions
): Promise<{ data: T | null; error: string | null; offline: boolean }> {
  if (typeof window !== "undefined" && !navigator.onLine) {
    return { data: null, error: null, offline: true };
  }

  const timeoutMs = fetchOpts?.timeoutMs ?? 10000;
  let lastStatus = 0;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options?.signal ? 0 : timeoutMs);

      const response = await fetch(url, {
        ...options,
        signal: options?.signal ?? controller.signal,
      });

      clearTimeout(timeoutId);
      lastStatus = response.status;

      if (!response.ok) {
        const shouldRetry = RETRY_STATUS.includes(response.status) && attempt < MAX_RETRIES - 1;
        if (shouldRetry) {
          await sleep(RETRY_DELAY_MS * Math.pow(2, attempt));
          continue;
        }
        return { data: null, error: humanError(response.status), offline: false };
      }

      const text = await response.text();
      try {
        const data = JSON.parse(text) as T;
        return { data, error: null, offline: false };
      } catch {
        return { data: null, error: "Serwer zwrócił nieprawidłową odpowiedź", offline: false };
      }
    } catch (e) {
      const isTransient =
        e instanceof Error &&
        (e.name === "AbortError" ||
          e.message.includes("fetch") ||
          e.message.includes("network") ||
          e.message.includes("Failed"));
      if (e instanceof TypeError && e.message.includes("fetch")) {
        return { data: null, error: null, offline: true };
      }
      if (isTransient && attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_DELAY_MS * Math.pow(2, attempt));
        continue;
      }
      if (e instanceof Error && e.name === "AbortError") {
        return { data: null, error: "Przekroczono czas oczekiwania", offline: false };
      }
      return {
        data: null,
        error: e instanceof Error ? e.message : "Błąd sieci",
        offline: false,
      };
    }
  }

  return {
    data: null,
    error: lastStatus ? humanError(lastStatus) : "Błąd połączenia — spróbuj ponownie",
    offline: false,
  };
}
