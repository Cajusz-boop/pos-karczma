/**
 * Simple in-memory rate limiter using sliding window.
 * For production with multiple instances, use Redis.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** Max requests per window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  limit: 100,
  windowMs: 60000,
};

const AUTH_CONFIG: RateLimitConfig = {
  limit: 10,
  windowMs: 60000,
};

/**
 * Check rate limit for a given key (typically IP address).
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetAt: now + config.windowMs,
      limit: config.limit,
    };
  }

  entry.count += 1;

  if (entry.count > config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      limit: config.limit,
    };
  }

  return {
    allowed: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
    limit: config.limit,
  };
}

/**
 * Get rate limit config based on route.
 */
export function getConfigForRoute(pathname: string): RateLimitConfig {
  if (pathname.startsWith("/api/auth/")) return AUTH_CONFIG;
  return DEFAULT_CONFIG;
}
