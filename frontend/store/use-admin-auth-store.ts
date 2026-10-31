import { create } from "zustand";
import { persist } from "zustand/middleware";
import { loginAdmin, registerAdmin, type AuthUser } from "@/lib/api/auth";
import { ApiRequestError } from "@/lib/api/client";
import { useCartStore } from "@/store/use-cart-store";

type AdminAuthState = {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  hasHydrated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (input: { name: string; email: string; password: string; registrationCode?: string }) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  setUser: (user: AuthUser) => void;
};

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,
      error: null,
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const result = await loginAdmin(email, password);
          set({ token: result.token, user: result.user, isAuthenticated: true, isLoading: false, error: null });
          return true;
        } catch (error) {
          const message =
            error instanceof ApiRequestError ? error.message : "Unable to sign in. Please try again.";
          set({ isLoading: false, error: message, isAuthenticated: false, token: null, user: null });
          return false;
        }
      },
      register: async (input) => {
        set({ isLoading: true, error: null });
        try {
          const result = await registerAdmin(input);
          set({ token: result.token, user: result.user, isAuthenticated: true, isLoading: false, error: null });
          return true;
        } catch (error) {
          const message =
            error instanceof ApiRequestError ? error.message : "Unable to create account. Please try again.";
          set({ isLoading: false, error: message, isAuthenticated: false, token: null, user: null });
          return false;
        }
      },
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false, error: null });

        useCartStore.getState().clearLocalOnly();
      },
      clearError: () => set({ error: null }),
      setUser: (user) => set({ user })
    }),
    {
      name: "NTM-Admin-Auth-Store",
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated })
    }
  )
);

if (typeof window !== "undefined") {
  useAdminAuthStore.persist.onFinishHydration(() => {
    useAdminAuthStore.setState({ hasHydrated: true });
  });
  if (useAdminAuthStore.persist.hasHydrated()) {
    useAdminAuthStore.setState({ hasHydrated: true });
  }

  // Listen for expired/invalid token notifications from the API client (avoids import cycles).
  // clearAdminAuthAndRedirect already removed localStorage; logout resets in-memory state + cart.
  window.addEventListener("ntm-admin-auth-expired", () => {
    useAdminAuthStore.getState().logout();
  });
}
