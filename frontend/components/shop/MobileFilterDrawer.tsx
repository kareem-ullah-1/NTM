"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, SlidersHorizontal } from "lucide-react";
import { useUiStore } from "@/store/use-ui-store";
import { FilterPanel } from "@/components/shop/FilterPanel";
import { drawerTransition, overlayTransition } from "@/lib/motion";

export function MobileFilterDrawer() {
  const { isMobileFilterOpen, openMobileFilter, closeMobileFilter } = useUiStore();
  const reduced = useReducedMotion();

  return (
    <>
      <button
        onClick={openMobileFilter}
        className="inline-flex items-center gap-2 rounded-lg border border-charcoal/15 px-4 py-2 text-sm text-charcoal lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
      </button>
      <AnimatePresence>
        {isMobileFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={reduced ? { duration: 0 } : overlayTransition}
              onClick={closeMobileFilter}
              className="fixed inset-0 z-[70] bg-charcoal/50 backdrop-blur-sm"
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: reduced ? 0 : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: reduced ? 0 : "-100%" }}
              transition={reduced ? { duration: 0 } : drawerTransition}
              role="dialog"
              aria-modal="true"
              aria-label="Filter fabrics"
              className="fixed inset-y-0 left-0 z-[80] flex w-[85vw] max-w-sm flex-col bg-cream shadow-2xl"
            >
              <div className="flex-1 overflow-y-auto p-6 pb-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-serif text-display-md text-charcoal">Filter Fabrics</span>
                  <button onClick={closeMobileFilter} aria-label="Close filters" className="rounded-full p-2 hover:bg-charcoal/5">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <FilterPanel />
              </div>
              <div className="border-t border-charcoal/10 bg-cream p-4">
                <button
                  onClick={closeMobileFilter}
                  className="w-full rounded-lg bg-forest px-6 py-3 text-sm font-medium text-cream hover:bg-forest-light"
                >
                  Show Results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
