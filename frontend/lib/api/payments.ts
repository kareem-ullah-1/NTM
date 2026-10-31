import { apiRequest } from "./client";

export type ApiPayment = {
  id: string;
  orderId: string;

  provider: "cod" | "easypaisa_jazzcash" | "bank_transfer" | "manual";
  status: "pending" | "paid" | "failed" | "refunded" | "cancelled";
  amount: number;
  currency: string;
  transactionRef: string | null;
  failureReason: string | null;
  paidAt: string | null;
  createdAt: string;
};

export async function fetchOrderPayment(orderId: string) {
  return apiRequest<ApiPayment>(`/payments/order/${encodeURIComponent(orderId)}`, { auth: true });
}

export async function updatePaymentStatus(
  paymentId: string,
  input: { status: ApiPayment["status"]; transactionRef?: string; note?: string }
) {
  return apiRequest<ApiPayment>(`/payments/${encodeURIComponent(paymentId)}/status`, {
    method: "PATCH",
    body: input,
    auth: true
  });
}

export async function collectCodPayment(paymentId: string) {
  return apiRequest<ApiPayment>(`/payments/${encodeURIComponent(paymentId)}/collect`, {
    method: "PATCH",
    auth: true
  });
}
