/**
 * In-memory rate limiter for Edge Runtime (middleware).
 * Uses sliding window algorithm.
 * 
 * NOTE: Redis-based rate limiting should be done in API routes, not middleware,
 * because middleware runs in Edge Runtime which doesn't support ioredis.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL = 60000;
let lastCleanup = Date.now();

function cleanupMemory() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of Array.from(memoryStore)) {
    if (entry.resetAt < now) {
      memoryStore.delete(key);
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

const HEAVY_CONFIG: RateLimitConfig = {
  limit: 30,
  windowMs: 60000,
};

/**
 * In-memory rate limit check.
 */
function checkRateLimitMemory(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanupMemory();

  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt < now) {
    memoryStore.set(key, { count: 1, resetAt: now + config.windowMs });
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
 * Check rate limit (synchronous, in-memory).
 * Safe to use in Edge Runtime (middleware).
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): RateLimitResult {
  return checkRateLimitMemory(key, config);
}

/**
 * Get rate limit config based on route.
 */
export function getConfigForRoute(pathname: string): RateLimitConfig {
  if (pathname.startsWith("/api/auth/")) return AUTH_CONFIG;
  if (pathname.startsWith("/api/reports/")) return HEAVY_CONFIG;
  if (pathname.startsWith("/api/export/")) return HEAVY_CONFIG;
  return DEFAULT_CONFIG;
}

/**
 * Reset rate limit for a key (useful for testing).
 */
export function resetRateLimit(key: string): void {
  memoryStore.delete(key);
}
