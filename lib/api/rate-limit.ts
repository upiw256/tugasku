import { redisConnection } from '@/lib/redis';

interface MemoryRateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory fallback if Redis is unavailable
const memoryStore = new Map<string, MemoryRateLimitRecord>();

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
}

/**
 * Check rate limit for a key (e.g. client IP, API Key, or userId)
 * @param key unique identifier for rate limiting
 * @param limit maximum allowed requests in the window
 * @param windowSeconds time window in seconds (default: 60 seconds)
 */
export async function checkRateLimit(
  key: string,
  limit: number = 100,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const redisKey = `ratelimit:${key}`;
  const now = Math.floor(Date.now() / 1000);

  // Try Redis first
  try {
    if (redisConnection && redisConnection.status === 'ready') {
      const current = await redisConnection.incr(redisKey);
      if (current === 1) {
        await redisConnection.expire(redisKey, windowSeconds);
      }
      const ttl = await redisConnection.ttl(redisKey);
      const resetTime = now + (ttl > 0 ? ttl : windowSeconds);
      const remaining = Math.max(0, limit - current);

      return {
        success: current <= limit,
        limit,
        remaining,
        reset: resetTime,
      };
    }
  } catch (error) {
    // Redis failed or disconnected, fall through to memoryStore
    console.warn('⚠️ RateLimiter: Redis fallback to in-memory store');
  }

  // Fallback: In-memory store
  const record = memoryStore.get(key);
  if (!record || now >= record.resetAt) {
    const newRecord: MemoryRateLimitRecord = {
      count: 1,
      resetAt: now + windowSeconds,
    };
    memoryStore.set(key, newRecord);

    // Garbage collection for memoryStore periodically
    if (memoryStore.size > 10000) {
      for (const [k, v] of memoryStore.entries()) {
        if (now >= v.resetAt) memoryStore.delete(k);
      }
    }

    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: newRecord.resetAt,
    };
  }

  record.count += 1;
  const remaining = Math.max(0, limit - record.count);
  return {
    success: record.count <= limit,
    limit,
    remaining,
    reset: record.resetAt,
  };
}
