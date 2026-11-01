import type { CorsOptions } from "cors";
import { env } from "./env";

function parseOrigins(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

// FRONTEND_URL is also used to build email links, so extra allowed origins
// (additional production/preview frontends) go in the optional CORS_ORIGIN.
const allowedOrigins = Array.from(
  new Set([...parseOrigins(env.frontendUrl), ...parseOrigins(process.env.CORS_ORIGIN)])
);

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};
