import { apiRequest } from "./client";

export type ContactPayload = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

export async function submitContactMessage(payload: ContactPayload) {
  return apiRequest<{ id: string }>("/contact", { method: "POST", body: payload });
}

export async function subscribeToNewsletter(email: string) {
  return apiRequest<{ email: string; alreadySubscribed: boolean }>("/newsletter", {
    method: "POST",
    body: { email }
  });
}
