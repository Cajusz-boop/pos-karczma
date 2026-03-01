import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
  keepAliveInterval: ReturnType<typeof setInterval> | undefined;
};

function createRedisClient(): Redis | null {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.warn("[Redis] REDIS_URL not configured, caching disabled");
    return null;
  }

  try {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 10) {
          console.warn("[Redis] Max retries reached, giving up");
          return null;
        }
        const delay = Math.min(times * 500, 5000);
        console.log(`[Redis] Reconnecting in ${delay}ms (attempt ${times})`);
        return delay;
      },
      enableReadyCheck: true,
      lazyConnect: false,
      connectTimeout: 5000,
      commandTimeout: 3000,
      enableOfflineQueue: true,
      reconnectOnError(err) {
        const targetErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT", "Connection is closed"];
        return targetErrors.some(e => err.message.includes(e));
      },
      keepAlive: 30000,
    });

    client.on("error", (err) => {
      if (!err.message.includes("ECONNREFUSED")) {
        console.error("[Redis] Connection error:", err.message);
      }
    });

    client.on("connect", () => {
      console.log("[Redis] Connected");
    });

    client.on("reconnecting", () => {
      console.log("[Redis] Reconnecting...");
    });

    client.on("close", () => {
      console.log("[Redis] Connection closed");
    });

    if (!globalForRedis.keepAliveInterval) {
      globalForRedis.keepAliveInterval = setInterval(async () => {
        if (client.status === "ready") {
          try {
            await client.ping();
          } catch {
            // ping failed, ioredis will handle reconnection
          }
        }
      }, 60000);
    }

    return client;
  } catch (error) {
    console.error("[Redis] Failed to create client:", error);
    return null;
  }
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production" && redis) {
  globalForRedis.redis = redis;
}

export interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

const DEFAULT_TTL = 60;

export async function cacheGet<T>(key: string, prefix = "cache"): Promise<T | null> {
  if (!redis) return null;
  
  try {
    const data = await redis.get(`${prefix}:${key}`);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    console.error("[Cache] Get error:", error);
    return null;
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<boolean> {
  if (!redis) return false;
  
  const { ttl = DEFAULT_TTL, prefix = "cache" } = options;
  
  try {
    await redis.setex(`${prefix}:${key}`, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("[Cache] Set error:", error);
    return false;
  }
}

export async function cacheDelete(key: string, prefix = "cache"): Promise<boolean> {
  if (!redis) return false;
  
  try {
    await redis.del(`${prefix}:${key}`);
    return true;
  } catch (error) {
    console.error("[Cache] Delete error:", error);
    return false;
  }
}

export async function cacheDeletePattern(pattern: string, prefix = "cache"): Promise<number> {
  if (!redis) return 0;
  
  try {
    const keys = await redis.keys(`${prefix}:${pattern}`);
    if (keys.length === 0) return 0;
    return await redis.del(...keys);
  } catch (error) {
    console.error("[Cache] Delete pattern error:", error);
    return 0;
  }
}

export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = DEFAULT_TTL, prefix = "cache" } = options;
  
  const cachedValue = await cacheGet<T>(key, prefix);
  if (cachedValue !== null) {
    return cachedValue;
  }
  
  const freshValue = await fetcher();
  await cacheSet(key, freshValue, { ttl, prefix });
  
  return freshValue;
}

export function isRedisAvailable(): boolean {
  return redis !== null;
}
