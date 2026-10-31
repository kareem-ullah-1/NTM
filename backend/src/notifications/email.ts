import nodemailer from "nodemailer";
import type { Transporter, SentMessageInfo } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { env, smtpConfigSummary } from "../config/env";

let transporter: Transporter<SMTPTransport.SentMessageInfo> | null = null;

export function isEmailConfigured(): boolean {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPassword);
}

export function describeEmailConfigStatus(): string {
  if (!isEmailConfigured()) {
    const missing: string[] = [];
    if (!env.smtpHost) missing.push("SMTP_HOST");
    if (!env.smtpUser) missing.push("SMTP_USER");
    if (!env.smtpPassword) missing.push("SMTP_PASSWORD");
    return `SMTP not configured — missing: ${missing.join(", ")} (${smtpConfigSummary()})`;
  }
  return `SMTP configured (${smtpConfigSummary()})`;
}

function isGmailHost(host: string): boolean {
  const h = host.toLowerCase();
  return h.includes("gmail.com") || h.includes("googlemail.com");
}

function buildSmtpOptions(): SMTPTransport.Options {
  const options: SMTPTransport.Options = {
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPassword
    },
    tls: {
      minVersion: "TLSv1.2"
    },
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000
  };

  // STARTTLS on port 587 (implicit TLS is secure:true on 465)
  if (!env.smtpSecure && env.smtpPort === 587) {
    options.requireTLS = true;
  }

  return options;
}

function getTransporter(): Transporter<SMTPTransport.SentMessageInfo> {
  if (!isEmailConfigured()) {
    throw new Error(
      "Email is not configured: set SMTP_HOST, SMTP_USER, SMTP_PASSWORD to enable notification emails"
    );
  }
  if (!transporter) {
    transporter = nodemailer.createTransport(buildSmtpOptions());

    if (isGmailHost(env.smtpHost)) {
      const fromDomain = env.notificationFromEmail.split("@")[1]?.toLowerCase() ?? "";
      const userDomain = env.smtpUser.split("@")[1]?.toLowerCase() ?? "";
      if (
        fromDomain &&
        userDomain &&
        fromDomain !== userDomain &&
        fromDomain !== "gmail.com" &&
        fromDomain !== "googlemail.com"
      ) {
        console.warn(
          `[Email] Gmail SMTP: configured From domain (${fromDomain}) differs from SMTP user domain (${userDomain}). ` +
            `Outbound mail will use the authenticated SMTP user as From to avoid Gmail policy rejects. ` +
            `Set NOTIFICATION_FROM_EMAIL to your Gmail address or a verified alias.`
        );
      }
    }
  }
  return transporter;
}

/** Drop cached transporter so the next send recreates it (e.g. after auth failure). */
export function resetEmailTransporter(): void {
  transporter = null;
}

/**
 * Format Nodemailer / SMTP errors for logs and notification_log without leaking secrets.
 */
export function formatSmtpError(err: unknown): string {
  if (!err || typeof err !== "object") {
    return String(err);
  }
  const e = err as {
    message?: string;
    code?: string;
    responseCode?: number;
    response?: string;
    command?: string;
    errno?: number;
    syscall?: string;
  };

  const parts: string[] = [];
  if (e.code) parts.push(`code=${e.code}`);
  if (e.responseCode != null) parts.push(`responseCode=${e.responseCode}`);
  if (e.command) parts.push(`command=${e.command}`);
  if (e.syscall) parts.push(`syscall=${e.syscall}`);
  if (e.errno != null) parts.push(`errno=${e.errno}`);
  if (e.response) {
    const cleaned = String(e.response).replace(/(pass(word)?|auth)=[^\s]+/gi, "$1=***");
    parts.push(`response=${cleaned}`);
  }
  if (e.message) {
    const cleaned = String(e.message).replace(/(pass(word)?|auth)=[^\s]+/gi, "$1=***");
    parts.push(`message=${cleaned}`);
  }
  return parts.length > 0 ? parts.join(" | ") : String(err);
}

export function isTransientSmtpError(err: unknown): boolean {
  const e = err as { code?: string; responseCode?: number; message?: string };
  const code = (e.code ?? "").toUpperCase();
  const msg = (e.message ?? "").toLowerCase();
  if (["ETIMEDOUT", "ECONNRESET", "ECONNREFUSED", "ESOCKET", "EAI_AGAIN", "ENOTFOUND"].includes(code)) {
    return true;
  }
  if (e.responseCode != null && e.responseCode >= 400 && e.responseCode < 500) {
    return true;
  }
  if (msg.includes("timeout") || msg.includes("temporarily") || msg.includes("try again")) {
    return true;
  }
  return false;
}

function resolveFromAddress(): { from: string; replyTo: string } {
  const displayName = env.notificationFromName || "NTM Fabrics";
  const fromEmail = isGmailHost(env.smtpHost)
    ? env.smtpUser
    : env.notificationFromEmail || env.smtpUser;
  return {
    from: `"${displayName}" <${fromEmail}>`,
    replyTo: env.notificationFromEmail || env.smtpUser
  };
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SentMessageInfo> {
  const client = getTransporter();
  const { from, replyTo } = resolveFromAddress();

  console.log(
    `[Email] Sending "${input.subject}" to ${input.to} via ${env.smtpHost}:${env.smtpPort} (from: ${from})`
  );

  try {
    const info = await client.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo
    });

    console.log(
      `[Email] Accepted by SMTP for ${input.to} (messageId=${info.messageId ?? "n/a"}, response=${info.response ?? "n/a"})`
    );
    return info;
  } catch (err) {
    const detail = formatSmtpError(err);
    console.error(`[Email] SMTP send FAILED to ${input.to}: ${detail}`);
    const code = (err as { code?: string }).code?.toUpperCase() ?? "";
    if (["EAUTH", "EENVELOPE", "ECONNECTION"].includes(code) || isTransientSmtpError(err)) {
      resetEmailTransporter();
    }
    throw new Error(detail);
  }
}

/**
 * Send with limited retries for transient network/SMTP 4xx errors.
 */
export async function sendEmailWithRetry(
  input: { to: string; subject: string; html: string; text: string },
  options: { maxAttempts?: number; baseDelayMs?: number } = {}
): Promise<SentMessageInfo> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 750;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await sendEmail(input);
    } catch (err) {
      lastError = err;
      const transient = isTransientSmtpError(err);
      console.error(
        `[Email] Attempt ${attempt}/${maxAttempts} failed (transient=${transient}): ${formatSmtpError(err)}`
      );
      if (!transient || attempt === maxAttempts) {
        break;
      }
      const delay = baseDelayMs * attempt;
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError instanceof Error ? lastError : new Error(formatSmtpError(lastError));
}

export async function verifyEmailTransport(): Promise<{
  ok: boolean;
  status: "not_configured" | "success" | "auth_failed" | "connection_failed";
  error?: string;
}> {
  if (!isEmailConfigured()) {
    return { ok: false, status: "not_configured", error: describeEmailConfigStatus() };
  }

  try {
    const client = getTransporter();
    await client.verify();
    return { ok: true, status: "success" };
  } catch (err) {
    const detail = formatSmtpError(err);
    console.error(`[Email] SMTP verify failed: ${detail}`);
    const code = ((err as { code?: string }).code ?? "").toUpperCase();
    const responseCode = (err as { responseCode?: number }).responseCode;
    const authFailed =
      code === "EAUTH" ||
      responseCode === 535 ||
      responseCode === 534 ||
      /auth|login|credentials|username|password/i.test(detail);

    resetEmailTransporter();

    return {
      ok: false,
      status: authFailed ? "auth_failed" : "connection_failed",
      error: detail
    };
  }
}
