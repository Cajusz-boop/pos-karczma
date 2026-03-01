const MAIN_SERVER = process.env.NEXT_PUBLIC_MAIN_SERVER_URL ?? "https://pos.karczma-labedz.pl";
const LOCAL_SERVER = process.env.NEXT_PUBLIC_LOCAL_SERVER_URL ?? "http://10.119.169.20:3001";

/**
 * Detect if running as Capacitor native app (APK).
 * In APK, the UI is served from local bundle, so window.location.origin
 * points to capacitor:// or file:// — NOT a real server.
 */
export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !!cap?.isNativePlatform?.();
}

let cachedBaseUrl: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30000; // 30 seconds

/**
 * Check server availability with timeout.
 */
async function checkServer(url: string, timeout = 3000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    await fetch(`${url}/api/ping`, {
      method: "HEAD",
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the base URL for API calls.
 * 
 * - Web mode: Returns empty string (uses relative URLs via current origin)
 * - Native app (APK): Returns absolute URL to cloud or local server
 * 
 * For native apps, prefers MAIN_SERVER (cloud) but falls back to LOCAL_SERVER
 * if cloud is unavailable and we're likely on local network.
 */
export async function getApiBaseUrl(): Promise<string> {
  if (typeof window === "undefined") return "";
  
  // Web mode — use relative URLs
  if (!isNativeApp()) {
    return window.location.origin;
  }
  
  // Native app — need absolute server URL
  const now = Date.now();
  if (cachedBaseUrl !== null && now - cacheTimestamp < CACHE_TTL) {
    return cachedBaseUrl;
  }
  
  // Try main server first (cloud)
  const mainAvailable = await checkServer(MAIN_SERVER);
  if (mainAvailable) {
    cachedBaseUrl = MAIN_SERVER;
    cacheTimestamp = now;
    return MAIN_SERVER;
  }
  
  // Fallback to local server
  const localAvailable = await checkServer(LOCAL_SERVER);
  if (localAvailable) {
    cachedBaseUrl = LOCAL_SERVER;
    cacheTimestamp = now;
    return LOCAL_SERVER;
  }
  
  // Both unavailable — return main server (will show appropriate error)
  cachedBaseUrl = MAIN_SERVER;
  cacheTimestamp = now;
  return MAIN_SERVER;
}

/**
 * Synchronous version — returns cached value or main server.
 * Use this when async is not possible (e.g., in sync code paths).
 * Call getApiBaseUrl() first to initialize the cache.
 */
export function getApiBaseUrlSync(): string {
  if (typeof window === "undefined") return "";
  if (!isNativeApp()) return window.location.origin;
  return cachedBaseUrl ?? MAIN_SERVER;
}

/**
 * Force refresh the cached base URL.
 */
export function invalidateApiBaseUrlCache(): void {
  cachedBaseUrl = null;
  cacheTimestamp = 0;
}
