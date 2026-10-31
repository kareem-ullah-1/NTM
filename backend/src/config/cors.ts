import type { CorsOptions } from "cors";
import { env } from "./env";

const allowedOrigins = env.frontendUrl.split(",").map((origin) => origin.trim());

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
