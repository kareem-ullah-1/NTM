import axios, { AxiosError, type AxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

const REQUEST_TIMEOUT_MS = 15000;
const TIMEOUT_MESSAGE = "Unable to connect to the server. Please try again.";

/** Zustand persist key used by useAdminAuthStore (see store/use-admin-auth-store.ts). */
export const ADMIN_AUTH_STORAGE_KEY = "NTM-Admin-Auth-Store";

/** Browser event name used to notify the auth store of an expired/invalid token without import cycles. */
export const ADMIN_AUTH_EXPIRED_EVENT = "ntm-admin-auth-expired";

export class ApiRequestError extends Error {
  status: number;
  errors?: unknown;

  constructor(status: number, message: string, errors?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.errors = errors;
  }
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string | null;
  data: T;
  meta: Record<string, unknown> | null;
}

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: REQUEST_TIMEOUT_MS
});

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Zustand persist shape: { state: { token, user, isAuthenticated }, version }
    const token = parsed?.state?.token;
    return typeof token === "string" && token.length > 0 ? token : null;
  } catch {
    return null;
  }
}

/**
 * Clear persisted admin auth and notify listeners (the Zustand store).
 * Redirects to /admin/login when the user is on a protected admin route.
 * Safe against SSR, missing localStorage, and repeated calls (no redirect loops).
 */
export function clearAdminAuthAndRedirect(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
  } catch {
    // ignore storage errors (private mode, quota, etc.)
  }

  try {
    window.dispatchEvent(new CustomEvent(ADMIN_AUTH_EXPIRED_EVENT));
  } catch {
    // ignore
  }

  const path = window.location?.pathname ?? "";
  // Avoid redirect loops: do not navigate if already on login or the public /admin entry
  // that AdminAuthGate handles itself.
  if (path.startsWith("/admin") && path !== "/admin/login" && path !== "/admin") {
    window.location.replace("/admin/login");
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | string[] | undefined | null>;
  auth?: boolean;
  signal?: AbortSignal;
};

function buildQueryString(query?: RequestOptions["query"]): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, String(item)));
    } else {
      params.append(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function toApiError(error: unknown): ApiRequestError {
  if (error instanceof ApiRequestError) return error;

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiEnvelope<unknown> & { errors?: unknown }>;

    if (axiosError.code === "ECONNABORTED" || axiosError.message?.toLowerCase().includes("timeout")) {
      return new ApiRequestError(0, TIMEOUT_MESSAGE);
    }

    if (!axiosError.response) {
      return new ApiRequestError(0, "Unable to reach the server. Please check your connection and try again.");
    }

    const payload = axiosError.response.data;
    const message = payload?.message ?? `Request failed with status ${axiosError.response.status}`;
    return new ApiRequestError(axiosError.response.status, message, payload?.errors);
  }

  return new ApiRequestError(0, "Something went wrong. Please try again.");
}

async function send<T>(path: string, options: RequestOptions): Promise<ApiEnvelope<T>> {
  const { method = "GET", body, query, auth = false, signal } = options;

  const headers: Record<string, string> = {};
  if (auth) {
    const token = getStoredToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const config: AxiosRequestConfig = {
    url: `${path}${buildQueryString(query)}`,
    method,
    headers,
    data: body,
    signal
  };

  try {
    const response = await httpClient.request<ApiEnvelope<T>>(config);

    if (!response.data?.success) {
      throw new ApiRequestError(
        response.status,
        response.data?.message ?? "Request failed",
        (response.data as { errors?: unknown } | undefined)?.errors
      );
    }

    return response.data;
  } catch (error) {
    const apiError = toApiError(error);

    // Only clear session when we intentionally sent (or expected) an admin token
    // and the backend rejected it as unauthorized.
    if (auth && apiError.status === 401) {
      clearAdminAuthAndRedirect();
    }

    throw apiError;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const envelope = await send<T>(path, options);
  return envelope.data;
}

export async function apiRequestWithMeta<T>(
  path: string,
  options: RequestOptions = {}
): Promise<{ data: T; meta: Record<string, unknown> | null }> {
  const envelope = await send<T>(path, options);
  return { data: envelope.data, meta: envelope.meta };
}
