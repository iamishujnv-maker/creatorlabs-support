import Redis from 'ioredis';

const REDIS_URL =
  process.env.REDIS_URL ||
  'redis://default:IlYNLd6O2Vi4XQmzPXJSsopVmKwa32dY@cars-sheep-sail-80767.db.redis.io:10199';

// Maintain a single Redis client across hot reloads in development & serverless instances
declare global {
  // eslint-disable-next-line no-var
  var _redisClient: Redis | undefined;
}

let redisClient: Redis | null = null;

try {
  if (process.env.NODE_ENV === 'development') {
    if (!global._redisClient) {
      global._redisClient = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 2,
        connectTimeout: 5000,
        lazyConnect: true,
      });
    }
    redisClient = global._redisClient;
  } else {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 2,
      connectTimeout: 5000,
      lazyConnect: true,
    });
  }

  redisClient.on('error', (err) => {
    console.warn('[Redis] Connection warning:', err?.message || err);
  });
} catch (e) {
  console.warn('[Redis] Initialization warning:', e);
}

export const redis = redisClient;

/**
 * Distributed sliding window rate limiter
 * Allows max `limit` requests per `windowSeconds` across all instances
 */
export async function checkDistributedRateLimit(
  key: string,
  limit: number = 5,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number }> {
  if (!redis) {
    return { allowed: true, remaining: limit };
  }

  const redisKey = `ratelimit:${key}`;

  try {
    // Atomically increment and set TTL if new
    const current = await redis.incr(redisKey);
    if (current === 1) {
      await redis.expire(redisKey, windowSeconds);
    }

    if (current > limit) {
      return { allowed: false, remaining: 0 };
    }

    return { allowed: true, remaining: Math.max(0, limit - current) };
  } catch (err) {
    console.warn('[Redis RateLimit] Fallback due to error:', err);
    // Graceful degradation: allow request if Redis temporarily unavailable
    return { allowed: true, remaining: limit };
  }
}

/**
 * Get cached JSON data
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Set cached JSON data with TTL
 */
export async function setCachedData(
  key: string,
  data: any,
  ttlSeconds: number = 120
): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch (err) {
    console.warn('[Redis Cache] Failed to write cache:', err);
  }
}
