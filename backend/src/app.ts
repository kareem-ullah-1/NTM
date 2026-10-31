import express, { type Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { corsOptions } from "./config/cors";
import { isProduction } from "./config/env";
import routes from "./routes";
import { errorHandler } from "./middleware/error.middleware";
import { notFoundHandler } from "./middleware/notFound.middleware";
import { apiRateLimiter, authRateLimiter } from "./middleware/rateLimit.middleware";

export function createApp(): Application {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors(corsOptions));

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(isProduction ? "combined" : "dev"));

  app.use("/api", apiRateLimiter);
  app.use("/api/auth/login", authRateLimiter);
  app.use("/api/auth/register", authRateLimiter);
  app.use("/api", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
