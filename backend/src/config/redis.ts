import Redis from "ioredis";
import { env, isProduction } from "./env";

const RECONNECT_COOLDOWN_MS = 30_000;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

let redisClient: Redis | null = null;
let redisReady = false;
let connecting: Promise<boolean> | null = null;
let lastFailureAt = 0;
let configWarned = false;

function warnOnce(message: string): void {
  if (configWarned) return;
  configWarned = true;
  console.warn(message);
}

function resolveRedisUrl(): string | undefined {
  const url = env.redisUrl;
  if (!url) return undefined;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    warnOnce("[Redis] REDIS_URL is not a valid URL — Redis disabled, using in-memory rate limiting.");
    return undefined;
  }

  if (parsed.protocol !== "redis:" && parsed.protocol !== "rediss:") {
    warnOnce("[Redis] REDIS_URL must start with redis:// or rediss:// — Redis disabled, using in-memory rate limiting.");
    return undefined;
  }

  if (isProduction && LOCAL_HOSTS.has(parsed.hostname)) {
    warnOnce("[Redis] REDIS_URL points to a local host in production — Redis disabled, using in-memory rate limiting.");
    return undefined;
  }

  return url;
}

export function isRedisConfigured(): boolean {
  return resolveRedisUrl() !== undefined;
}

export function getRedis(): Redis | null {
  return redisClient;
}

export function isRedisReady(): boolean {
  return redisReady && redisClient !== null && redisClient.status === "ready";
}

export function ensureRedisClient(): Redis | null {
  if (redisClient) return redisClient;
  const url = resolveRedisUrl();
  if (!url) return null;

  redisClient = new Redis(url, {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 3000,
    commandTimeout: 1500,
    retryStrategy(times) {
      if (times > 5) return null;
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

  redisClient.on("close", () => {
    redisReady = false;
  });

  redisClient.on("end", () => {
    redisReady = false;
  });

  return redisClient;
}

export function markRedisFailure(): void {
  redisReady = false;
  lastFailureAt = Date.now();
  redisClient?.disconnect();
}

async function attemptConnect(client: Redis): Promise<boolean> {
  try {
    if (client.status === "wait" || client.status === "end") {
      await client.connect();
    }
    await client.ping();
    redisReady = true;
    return true;
  } catch (error) {
    console.warn(
      "[Redis] unavailable — using in-memory fallback.",
      error instanceof Error ? error.message : error
    );
    markRedisFailure();
    return false;
  }
}

export function connectRedis(): Promise<boolean> {
  const client = ensureRedisClient();
  if (!client) return Promise.resolve(false);
  if (isRedisReady()) return Promise.resolve(true);
  if (Date.now() - lastFailureAt < RECONNECT_COOLDOWN_MS) return Promise.resolve(false);
  if (client.status !== "wait" && client.status !== "end") return Promise.resolve(false);
  if (!connecting) {
    connecting = attemptConnect(client).finally(() => {
      connecting = null;
    });
  }
  return connecting;
}

export async function initRedis(): Promise<void> {
  if (!ensureRedisClient()) {
    console.log("[Redis] REDIS_URL not set — using in-memory rate limiting only");
    return;
  }
  const connected = await connectRedis();
  if (connected) {
    console.log("[Redis] connection established");
  }
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit().catch(() => undefined);
    redisClient = null;
    redisReady = false;
  }
}
