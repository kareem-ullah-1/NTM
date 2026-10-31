import { create } from "zustand";

export type ToastVariant = "success" | "error";

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastState = {
  toasts: ToastItem[];
  showToast: (message: string, variant?: ToastVariant) => void;
  dismissToast: (id: string) => void;
};

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  showToast: (message, variant = "success") => {
    const id = `${Date.now()}-${Math.random()}`;
    set({ toasts: [...get().toasts, { id, message, variant }] });
    setTimeout(() => {
      set({ toasts: get().toasts.filter((toast) => toast.id !== id) });
    }, 4000);
  },
  dismissToast: (id) =>
    set({ toasts: get().toasts.filter((toast) => toast.id !== id) })
}));
