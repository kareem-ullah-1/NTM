"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { useFilterStore, type SortOption } from "@/store/use-filter-store";
import { cn } from "@/lib/utils";

const options: SortOption[] = [
  "Featured",
  "Newest",
  "Price low to high",
  "Price high to low"
];

export function SortSelect() {
  const sortBy = useFilterStore((state) => state.sortBy);
  const setSortBy = useFilterStore((state) => state.setSortBy);
  const reduced = useReducedMotion();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const [highlightIndex, setHighlightIndex] = React.useState(() =>
    Math.max(0, options.indexOf(sortBy))
  );

  React.useEffect(() => {
    setHighlightIndex(Math.max(0, options.indexOf(sortBy)));
  }, [sortBy]);

  React.useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function selectOption(option: SortOption) {
    setSortBy(option);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function onButtonKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
      setHighlightIndex(Math.max(0, options.indexOf(sortBy)));
    }
  }

  function onListKeyDown(event: React.KeyboardEvent<HTMLUListElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((i) => (i + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((i) => (i - 1 + options.length) % options.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      setHighlightIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setHighlightIndex(options.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectOption(options[highlightIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  React.useEffect(() => {
    if (!open) return;
    // Focus list for keyboard nav when opened
    listRef.current?.focus();
  }, [open]);

  return (
    <div ref={rootRef} className="relative w-full shrink-0 sm:w-auto">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onButtonKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="shop-sort-listbox"
        className={cn(
          // Match ShopSearchInput / Input visual language exactly
          "inline-flex h-11 w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-charcoal/15 bg-white px-4 text-left text-sm text-charcoal shadow-[0_1px_0_rgba(26,26,24,0.02)]",
          "transition-[border-color,box-shadow] duration-150",
          "hover:border-charcoal/25",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-cream focus-visible:border-forest/40",
          // Open state — subtle emphasis without fighting focus ring
          open && "border-forest/40 ring-2 ring-forest/20",
          // Comfortable fixed width on sm+ so long options never feel cramped
          "sm:min-w-[200px] sm:w-auto md:min-w-[220px]"
        )}
      >
        <span className="flex min-w-0 flex-col gap-0 leading-none">
          <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-charcoal/45">
            Sort By
          </span>
          <span className="mt-0.5 truncate font-medium text-charcoal">{sortBy}</span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-charcoal/45 transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            id="shop-sort-listbox"
            role="listbox"
            tabIndex={-1}
            aria-label="Sort products"
            aria-activedescendant={`shop-sort-option-${highlightIndex}`}
            onKeyDown={onListKeyDown}
            initial={reduced ? false : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: reduced ? 0 : 0.16, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              // Positioned below control; does not shift layout
              "absolute left-0 right-0 z-40 mt-1.5 origin-top overflow-hidden rounded-lg border border-charcoal/10 bg-white py-1.5",
              "shadow-[0_12px_32px_-8px_rgba(28,28,28,0.18)] focus:outline-none",
              // On larger screens give the menu a bit more room; on mobile stay within control width
              "sm:left-auto sm:right-0 sm:min-w-[220px] sm:w-max"
            )}
          >
            {options.map((option, index) => {
              const selected = option === sortBy;
              const highlighted = index === highlightIndex;
              return (
                <li
                  key={option}
                  id={`shop-sort-option-${index}`}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setHighlightIndex(index)}
                  onClick={() => selectOption(option)}
                  className={cn(
                    // Comfortable option height + clean spacing; touch-friendly
                    "flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors",
                    "min-h-[44px] sm:min-h-0 sm:py-2.5",
                    highlighted
                      ? "bg-forest/[0.07] text-charcoal"
                      : "text-charcoal/75 hover:bg-charcoal/[0.03]",
                    selected && "font-medium text-charcoal"
                  )}
                >
                  <span className="truncate">{option}</span>
                  {selected && (
                    <Check
                      className="h-4 w-4 shrink-0 text-forest"
                      aria-hidden
                    />
                  )}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
