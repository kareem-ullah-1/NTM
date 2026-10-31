export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

export function isAnalyticsConfigured(): boolean {
  return GA_MEASUREMENT_ID.length > 0;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  item_category?: string;
  price?: number;
  quantity?: number;
};

type EcommerceEventParams = {
  currency?: string;
  value?: number;
  items?: AnalyticsItem[];
  transaction_id?: string;
  [key: string]: unknown;
};

export function trackEvent(eventName: string, params?: EcommerceEventParams): void {
  if (typeof window === "undefined") return;
  if (!isAnalyticsConfigured()) return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event: eventName, ...params });
}
