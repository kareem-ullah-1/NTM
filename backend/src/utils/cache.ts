import { getRedis, isRedisReady } from "../config/redis";

/**
 * Lightweight Redis cache helpers. All operations are no-ops when Redis is
 * unavailable so callers never have to special-case the missing client.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client || !isRedisReady()) return null;
  try {
    const raw = await client.get(key);
    if (raw == null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds = 60
): Promise<void> {
  const client = getRedis();
  if (!client || !isRedisReady()) return;
  try {
    await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // ignore cache write failures
  }
}

export async function cacheDel(key: string | string[]): Promise<void> {
  const client = getRedis();
  if (!client || !isRedisReady()) return;
  try {
    const keys = Array.isArray(key) ? key : [key];
    if (keys.length > 0) await client.del(...keys);
  } catch {
    // ignore
  }
}

/** Invalidate keys matching a simple prefix (uses SCAN under the hood). */
export async function cacheDelByPrefix(prefix: string): Promise<void> {
  const client = getRedis();
  if (!client || !isRedisReady()) return;
  try {
    let cursor = "0";
    do {
      const [next, keys] = await client.scan(cursor, "MATCH", `${prefix}*`, "COUNT", 100);
      cursor = next;
      if (keys.length > 0) await client.del(...keys);
    } while (cursor !== "0");
  } catch {
    // ignore
  }
}
