import rateLimit from "express-rate-limit";
import { RedisStore, type RedisReply } from "rate-limit-redis";
import { ensureRedisClient } from "../config/redis";

/**
 * Build a Redis-backed store when REDIS_URL is configured.
 * The client is created lazily; ioredis queues commands until connected.
 * When no Redis URL is set we return undefined so express-rate-limit uses MemoryStore.
 */
function createStore(prefix: string) {
  const client = ensureRedisClient();
  if (!client) {
    return undefined;
  }

  return new RedisStore({
    prefix: `rl:${prefix}:`,
    sendCommand: (command: string, ...args: string[]) =>
      client.call(command, ...args) as Promise<RedisReply>
  });
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
