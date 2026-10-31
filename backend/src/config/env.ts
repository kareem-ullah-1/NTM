import fs from "fs";
import path from "path";
import dotenv from "dotenv";

/**
 * Load .env from known locations so SMTP vars work whether the process is started
 * from the backend root, monorepo root, via ts-node, or from compiled dist/.
 * Does not override variables already set in the real environment (deployment).
 */
function loadEnvFiles(): void {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "backend", ".env"),
    path.resolve(__dirname, "..", "..", ".env"), // backend/.env from src/config or dist/config
    path.resolve(__dirname, "..", ".env")
  ];

  const loaded: string[] = [];
  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const result = dotenv.config({ path: filePath, override: false });
        if (!result.error) {
          loaded.push(filePath);
        }
      }
    } catch {
      // ignore unreadable paths
    }
  }

  if (loaded.length === 0) {
    dotenv.config({ override: false });
  }
}

loadEnvFiles();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Gmail app passwords are often copied with spaces; strip them for reliable SMTP auth. */
function normalizeSmtpPassword(raw: string): string {
  return raw.replace(/\s+/g, "").trim();
}

const smtpUser = (process.env.SMTP_USER ?? "").trim();
const smtpPassword = normalizeSmtpPassword(process.env.SMTP_PASSWORD ?? "");

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "5000", 10),

  databaseUrl: required("DATABASE_URL"),
  pgSsl: process.env.PGSSL === "true",

  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",

  frontendUrl: required("FRONTEND_URL", "http://localhost:3000"),

  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? "10", 10),

  adminSeedName: process.env.ADMIN_SEED_NAME ?? "Admin",
  adminSeedEmail: process.env.ADMIN_SEED_EMAIL ?? "admin@noorfabrics.pk",
  adminSeedPassword: process.env.ADMIN_SEED_PASSWORD ?? "ChangeMe123!",

  adminRegistrationCode: process.env.ADMIN_REGISTRATION_CODE ?? "",

  r2AccountId: process.env.R2_ACCOUNT_ID ?? "",
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  r2BucketName: process.env.R2_BUCKET_NAME ?? "",
  r2PublicUrl: (process.env.R2_PUBLIC_URL ?? "").replace(/\/+$/, ""),
  r2UploadFolder: process.env.R2_UPLOAD_FOLDER ?? "ntm-fabrics/products",

  smtpHost: (process.env.SMTP_HOST ?? "").trim(),
  smtpPort: parseInt(process.env.SMTP_PORT ?? "587", 10),
  smtpUser,
  smtpPassword,
  // Port 465 uses implicit TLS (secure: true). Port 587 uses STARTTLS (secure: false + requireTLS).
  smtpSecure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
  // Gmail rejects From addresses that are not the authenticated mailbox (unless verified aliases).
  notificationFromEmail: (process.env.NOTIFICATION_FROM_EMAIL ?? (smtpUser || "orders@ntmfabrics.pk")).trim(),
  notificationFromName: (process.env.NOTIFICATION_FROM_NAME ?? "NTM Fabrics").trim(),

  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioFromNumber: process.env.TWILIO_FROM_NUMBER ?? "",

  /** Optional. When set, rate limiting (and future caches) use Redis. Example: redis://localhost:6379 */
  redisUrl: (process.env.REDIS_URL ?? "").trim() || undefined
};

export const isProduction = env.nodeEnv === "production";

/** Safe summary for logs — never includes passwords or full secrets. */
export function smtpConfigSummary(): string {
  const host = env.smtpHost || "(missing)";
  const userSet = env.smtpUser ? "set" : "missing";
  const passSet = env.smtpPassword ? "set" : "missing";
  const from = env.notificationFromEmail || "(missing)";
  return `host=${host} port=${env.smtpPort} secure=${env.smtpSecure} user=${userSet} password=${passSet} from=${from}`;
}
