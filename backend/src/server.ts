import app from "./app";
import { env, smtpConfigSummary } from "./config/env";
import { checkDbConnection, checkRequiredTables } from "./config/db";
import { initRedis } from "./config/redis";
import { isEmailConfigured, verifyEmailTransport, describeEmailConfigStatus } from "./notifications/email";

async function bootstrap(): Promise<void> {
  // Redis is optional — rate limiters fall back to memory if unavailable
  await initRedis();

  try {
    await checkDbConnection();
    console.log("PostgreSQL connection established.");
  } catch (error) {
    console.error("Failed to connect to PostgreSQL. Check DATABASE_URL in your .env file.", error);
    process.exit(1);
  }

  try {
    await checkRequiredTables();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  if (isEmailConfigured()) {
    console.log(`[Email] SMTP configured — ${smtpConfigSummary()}`);
    // Non-blocking verify: bad credentials must not prevent the API from starting
    verifyEmailTransport()
      .then((result) => {
        if (result.status === "success") {
          console.log("[Email] SMTP connection successful — order confirmation emails enabled");
        } else if (result.status === "auth_failed") {
          console.error(
            `[Email] SMTP authentication failed — check SMTP_USER and SMTP_PASSWORD (App Password for Gmail). Detail: ${result.error}`
          );
        } else if (result.status === "connection_failed") {
          console.error(
            `[Email] SMTP connection failed — check SMTP_HOST, SMTP_PORT, firewall, and TLS settings. Detail: ${result.error}`
          );
        } else {
          console.error(`[Email] SMTP not ready: ${result.error}`);
        }
      })
      .catch((err) => {
        console.error("[Email] SMTP verify error:", err instanceof Error ? err.message : err);
      });
  } else {
    console.warn(`[Email] ${describeEmailConfigStatus()}`);
    console.warn(
      "[Email] Order confirmation emails will be skipped until SMTP_HOST, SMTP_USER, and SMTP_PASSWORD are set in the server environment."
    );
  }

  app.listen(env.port, () => {
    console.log(`NTM Fabrics API listening on port ${env.port} [${env.nodeEnv}]`);
  });
}

bootstrap();
