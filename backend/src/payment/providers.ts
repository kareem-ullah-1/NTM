import type { ActiveProviderName, PaymentStatus } from "../models/payment.model";

export interface PaymentInitiationResult {
  status: PaymentStatus;
  gatewayResponse: Record<string, unknown>;
}

export interface PaymentProvider {
  name: ActiveProviderName;
  initiate(params: { orderId: string; amount: number; currency?: string }): Promise<PaymentInitiationResult>;
    isConfigured(): boolean;
}

const CodProvider: PaymentProvider = {
  name: "cod",
  initiate: async () => ({ status: "pending", gatewayResponse: { note: "Cash collected on delivery" } }),
  isConfigured: () => true
};

const ManualProvider: PaymentProvider = {
  name: "manual",
  initiate: async () => ({ status: "pending", gatewayResponse: { note: "Awaiting manual verification" } }),
  isConfigured: () => true
};

export const PAYMENT_PROVIDERS: Record<ActiveProviderName, PaymentProvider> = {
  cod: CodProvider,
  manual: ManualProvider
};

const ORDER_PAYMENT_METHOD_TO_PROVIDER: Record<string, ActiveProviderName> = {
  "Cash on Delivery": "cod"
};

export function providerForOrderPaymentMethod(method: string): PaymentProvider {
  const providerName = ORDER_PAYMENT_METHOD_TO_PROVIDER[method] ?? "manual";
  return PAYMENT_PROVIDERS[providerName];
}
