import twilio from "twilio";
import { env } from "../config/env";

type Twilio = ReturnType<typeof twilio>;

let client: Twilio | null = null;

export function isSmsConfigured(): boolean {
  return Boolean(env.twilioAccountSid && env.twilioAuthToken && env.twilioFromNumber);
}

function getClient(): Twilio {
  if (!isSmsConfigured()) {
    throw new Error(
      "SMS is not configured: set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER to enable notification texts"
    );
  }
  if (!client) {
    client = twilio(env.twilioAccountSid, env.twilioAuthToken);
  }
  return client;
}

export function toE164Pakistan(localNumber: string): string {
  const digits = localNumber.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("0")) return `+92${digits.slice(1)}`;
  if (digits.startsWith("92")) return `+${digits}`;
  return `+${digits}`;
}

export async function sendSms(input: { to: string; body: string }): Promise<void> {
  const smsClient = getClient();
  await smsClient.messages.create({
    to: toE164Pakistan(input.to),
    from: env.twilioFromNumber,
    body: input.body
  });
}
