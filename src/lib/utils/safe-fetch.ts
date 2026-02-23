/**
 * Safe fetch — unika crashu gdy serwer zwraca HTML zamiast JSON (offline, 502, error page).
 * Zawsze parsuj text() przed JSON.parse() z try/catch.
 */
export async function safeFetch<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null; offline: boolean }> {
  if (typeof window !== "undefined" && !navigator.onLine) {
    return { data: null, error: null, offline: true };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options?.signal ? 0 : 10000);

    const response = await fetch(url, {
      ...options,
      signal: options?.signal ?? controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { data: null, error: `HTTP ${response.status}`, offline: false };
    }

    const text = await response.text();
    try {
      const data = JSON.parse(text) as T;
      return { data, error: null, offline: false };
    } catch {
      return { data: null, error: "Serwer zwrócił nieprawidłową odpowiedź", offline: false };
    }
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      return { data: null, error: "Przekroczono czas oczekiwania", offline: false };
    }
    if (e instanceof TypeError && e.message.includes("fetch")) {
      return { data: null, error: null, offline: true };
    }
    return {
      data: null,
      error: e instanceof Error ? e.message : "Błąd sieci",
      offline: false,
    };
  }
}
