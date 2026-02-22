/**
 * Enhanced fetch wrapper with timeout, retry logic, and error handling.
 * Use this instead of raw fetch() for better mobile stability.
 */

export interface FetchOptions extends RequestInit {
  /** Timeout in milliseconds (default: 15000) */
  timeout?: number;
  /** Number of retries for transient errors (default: 0) */
  retries?: number;
  /** Base delay between retries in ms, doubles each attempt (default: 1000) */
  retryDelay?: number;
  /** HTTP status codes to retry on (default: [408, 429, 500, 502, 503, 504]) */
  retryOn?: number[];
}

export interface FetchResult<T = unknown> {
  data: T | null;
  error: string | null;
  status: number;
  ok: boolean;
}

const DEFAULT_TIMEOUT = 15000;
const DEFAULT_RETRY_DELAY = 1000;
const DEFAULT_RETRY_ON = [408, 429, 500, 502, 503, 504];

export class FetchTimeoutError extends Error {
  constructor(url: string, timeout: number) {
    super(`Request to ${url} timed out after ${timeout}ms`);
    this.name = "FetchTimeoutError";
  }
}

export class FetchRetryExhaustedError extends Error {
  constructor(url: string, attempts: number, lastError: string) {
    super(`Request to ${url} failed after ${attempts} attempts: ${lastError}`);
    this.name = "FetchRetryExhaustedError";
  }
}

/**
 * Fetch with automatic timeout using AbortController.
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = 0,
    retryDelay = DEFAULT_RETRY_DELAY,
    retryOn = DEFAULT_RETRY_ON,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;
  let attempts = 0;

  while (attempts <= retries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok && retryOn.includes(response.status) && attempts < retries) {
        attempts++;
        const delay = retryDelay * Math.pow(2, attempts - 1);
        await sleep(delay);
        continue;
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          lastError = new FetchTimeoutError(url, timeout);
        } else {
          lastError = error;
        }
      }

      if (attempts < retries && isTransientError(error)) {
        attempts++;
        const delay = retryDelay * Math.pow(2, attempts - 1);
        await sleep(delay);
        continue;
      }

      throw lastError ?? error;
    }
  }

  throw lastError ?? new Error(`Fetch failed for ${url}`);
}

/**
 * Fetch JSON with timeout and automatic parsing.
 * Returns a result object instead of throwing.
 */
export async function fetchJson<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResult<T>> {
  try {
    const response = await fetchWithTimeout(url, options);
    const status = response.status;
    const ok = response.ok;

    if (!ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        data: null,
        error: errorData.error ?? `HTTP ${status}`,
        status,
        ok: false,
      };
    }

    const data = await response.json();
    return { data, error: null, status, ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd sieci";
    return {
      data: null,
      error: message,
      status: 0,
      ok: false,
    };
  }
}

/**
 * POST JSON with timeout.
 */
export async function postJson<T = unknown>(
  url: string,
  body: unknown,
  options: FetchOptions = {}
): Promise<FetchResult<T>> {
  return fetchJson<T>(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: JSON.stringify(body),
    ...options,
  });
}

/**
 * PATCH JSON with timeout.
 */
export async function patchJson<T = unknown>(
  url: string,
  body: unknown,
  options: FetchOptions = {}
): Promise<FetchResult<T>> {
  return fetchJson<T>(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: JSON.stringify(body),
    ...options,
  });
}

function isTransientError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.name === "AbortError" ||
      error.message.includes("network") ||
      error.message.includes("Network") ||
      error.message.includes("ECONNRESET") ||
      error.message.includes("ETIMEDOUT")
    );
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
