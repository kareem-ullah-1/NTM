"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { useToastStore, type ToastVariant } from "@/store/use-toast-store";
import { cn } from "@/lib/utils";

const VARIANT_STYLES: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; iconColor: string; borderColor: string }
> = {
  success: {
    icon: CheckCircle2,
    iconColor: "text-forest",
    borderColor: "border-forest/20"
  },
  error: {
    icon: XCircle,
    iconColor: "text-red-500",
    borderColor: "border-red-200"
  }
};

export function Toaster() {
  const { toasts, dismissToast } = useToastStore();
  const reduced = useReducedMotion();

  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0">
      <AnimatePresence>
        {toasts.map((toast) => {
          const style = VARIANT_STYLES[toast.variant];
          const Icon = style.icon;
          return (
            <motion.div
              key={toast.id}
              initial={reduced ? false : { opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? undefined : { opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: reduced ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "pointer-events-auto flex items-center gap-3 rounded-card border bg-white px-4 py-3 shadow-lg",
                style.borderColor
              )}
              role="alert"
              aria-live="assertive"
            >
              <Icon className={cn("h-5 w-5 shrink-0", style.iconColor)} />
              <p className="flex-1 text-sm text-charcoal">{toast.message}</p>
              <button
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="ml-auto shrink-0 text-charcoal/40 hover:text-charcoal"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
