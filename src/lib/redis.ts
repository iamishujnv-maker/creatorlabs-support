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

/**
 * System-Wide Daily Limit (Maximum 1,000 lookups per day)
 */
export async function checkDailyGlobalLimit(
  maxDaily: number = 1000
): Promise<{ allowed: boolean; currentCount: number }> {
  if (!redis) {
    return { allowed: true, currentCount: 0 };
  }

  // Daily date key in IST (YYYY-MM-DD)
  const istDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const key = `ratelimit:global_daily:${istDate}`;

  try {
    const current = await redis.incr(key);
    if (current === 1) {
      // 48 hours TTL so it expires automatically after the day ends
      await redis.expire(key, 86400 * 2);
    }

    if (current > maxDaily) {
      return { allowed: false, currentCount: current };
    }

    return { allowed: true, currentCount: current };
  } catch (err) {
    console.warn('[Redis Global Daily Limit] Fallback due to error:', err);
    return { allowed: true, currentCount: 0 };
  }
}

/**
 * Safely extracts client IP resisting header spoofing (e.g. fake / random X-Forwarded-For)
 */
export function getTrustedClientIp(request: Request | { headers: Headers }): string {
  const headers = 'headers' in request ? request.headers : new Headers();

  // 1. Untamperable edge provider headers (Vercel & Cloudflare strictly overwrite these at edge)
  const vercelIp = headers.get('x-vercel-forwarded-for')?.trim();
  if (vercelIp && isValidIp(vercelIp)) {
    return vercelIp;
  }

  const cfIp = headers.get('cf-connecting-ip')?.trim();
  if (cfIp && isValidIp(cfIp)) {
    return cfIp;
  }

  const realIp = headers.get('x-real-ip')?.trim();
  if (realIp && isValidIp(realIp)) {
    return realIp;
  }

  // 2. NextRequest native IP if available on the request object
  const reqIp = (request as any).ip;
  if (typeof reqIp === 'string' && isValidIp(reqIp.trim())) {
    return reqIp.trim();
  }

  // 3. X-Forwarded-For handling:
  // When an attacker sends random or spoofed X-Forwarded-For headers,
  // trusted reverse proxies append the real IP at the end of the chain.
  // We validate and select the last valid IP in the list.
  const xff = headers.get('x-forwarded-for');
  if (xff) {
    const validIps = xff
      .split(',')
      .map((p) => p.trim())
      .filter((p) => isValidIp(p));

    if (validIps.length > 0) {
      return validIps[validIps.length - 1];
    }
  }

  return '127.0.0.1';
}

function isValidIp(ip: string): boolean {
  if (!ip || typeof ip !== 'string' || ip.length > 45) return false;

  // IPv4 regex (validates 0-255 in each octet)
  const ipv4Regex =
    /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
  if (ipv4Regex.test(ip)) return true;

  // IPv6 regex
  const ipv6Regex =
    /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
  if (ipv6Regex.test(ip)) return true;

  return false;
}
