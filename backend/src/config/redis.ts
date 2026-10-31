import Redis from "ioredis";
import { env } from "./env";

let redisClient: Redis | null = null;
let redisReady = false;

/**
 * Optional Redis client. When REDIS_URL is not set the app continues with
 * in-memory rate limiting (and no distributed cache).
 */
export function getRedis(): Redis | null {
  return redisClient;
}

export function isRedisReady(): boolean {
  return redisReady && redisClient !== null;
}

/**
 * Create (but do not necessarily connect) the Redis client if REDIS_URL is configured.
 * Safe to call multiple times. Connection is established in initRedis().
 */
export function ensureRedisClient(): Redis | null {
  if (redisClient) return redisClient;
  const url = env.redisUrl;
  if (!url) return null;

  redisClient = new Redis(url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
    connectTimeout: 5000,
    retryStrategy(times) {
      if (times > 8) return null;
      return Math.min(times * 200, 2000);
    }
  });

  redisClient.on("error", (err) => {
    if (redisReady) {
      console.error("[Redis] connection error:", err.message);
    }
    redisReady = false;
  });

  redisClient.on("ready", () => {
    redisReady = true;
    console.log("[Redis] ready");
  });

  redisClient.on("end", () => {
    redisReady = false;
  });

  return redisClient;
}

export async function initRedis(): Promise<void> {
  const client = ensureRedisClient();
  if (!client) {
    console.log("[Redis] REDIS_URL not set — using in-memory rate limiting only");
    return;
  }

  try {
    // connect() is a no-op if already connecting / connected with lazyConnect
    if (client.status === "wait") {
      await client.connect();
    }
    await client.ping();
    redisReady = true;
    console.log("[Redis] connection established");
  } catch (error) {
    console.warn(
      "[Redis] failed to connect — falling back to in-memory stores where possible.",
      error instanceof Error ? error.message : error
    );
    redisReady = false;
    // Keep the client instance so it can reconnect later; do not null it out
  }
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit().catch(() => undefined);
    redisClient = null;
    redisReady = false;
  }
}
