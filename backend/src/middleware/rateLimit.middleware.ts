import rateLimit, {
  MemoryStore,
  type ClientRateLimitInfo,
  type Options,
  type Store
} from "express-rate-limit";
import { RedisStore, type RedisReply } from "rate-limit-redis";
import { connectRedis, ensureRedisClient, isRedisConfigured, markRedisFailure } from "../config/redis";

class ResilientStore implements Store {
  localKeys = false;
  private readonly memory = new MemoryStore();
  private redis: RedisStore | null = null;
  private options: Options | null = null;

  constructor(private readonly name: string) {}

  init(options: Options): void {
    this.options = options;
    this.memory.init(options);
  }

  private async redisStore(): Promise<RedisStore | null> {
    if (!(await connectRedis())) return null;
    if (this.redis) return this.redis;

    const client = ensureRedisClient();
    if (!client || !this.options) return null;

    const store = new RedisStore({
      prefix: `rl:${this.name}:`,
      sendCommand: (command: string, ...args: string[]) =>
        client.call(command, ...args) as Promise<RedisReply>
    });
    store.init(this.options);

    try {
      await Promise.all([store.incrementScriptSha, store.getScriptSha]);
    } catch {
      markRedisFailure();
      return null;
    }

    this.redis = store;
    return store;
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    const store = await this.redisStore().catch(() => null);
    if (store) {
      try {
        return await store.increment(key);
      } catch {
        this.redis = null;
        markRedisFailure();
      }
    }
    return this.memory.increment(key);
  }

  async decrement(key: string): Promise<void> {
    this.memory.decrement(key);
    const store = await this.redisStore().catch(() => null);
    await store?.decrement(key).catch(() => undefined);
  }

  async resetKey(key: string): Promise<void> {
    this.memory.resetKey(key);
    const store = await this.redisStore().catch(() => null);
    await store?.resetKey(key).catch(() => undefined);
  }
}

function createStore(name: string): Store | undefined {
  return isRedisConfigured() ? new ResilientStore(name) : undefined;
}

const common = {
  standardHeaders: true,
  legacyHeaders: false
} as const;

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  ...common,
  store: createStore("api"),
  message: { success: false, message: "Too many requests, please try again later.", errors: null }
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  ...common,
  store: createStore("auth"),
  message: { success: false, message: "Too many login attempts, please try again later.", errors: null }
});

export const adminVerificationResendRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  ...common,
  store: createStore("admin-verify"),
  message: {
    success: false,
    message: "Too many verification emails requested. Please wait before trying again.",
    errors: null
  }
});

export const guestReviewRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  ...common,
  store: createStore("guest-review"),
  skip: (req) => Boolean(req.user),
  message: {
    success: false,
    message: "Too many reviews submitted recently. Please try again later.",
    errors: null
  }
});

export const guestReviewUploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  ...common,
  store: createStore("guest-upload"),
  skip: (req) => Boolean(req.user),
  message: {
    success: false,
    message: "Too many upload requests. Please try again later.",
    errors: null
  }
});
