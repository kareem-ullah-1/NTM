"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { fetchSearchSuggestions } from "@/lib/api/products";
import { queryKeys } from "@/lib/api/query-keys";
import { formatPrice, cn } from "@/lib/utils";

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);
  return debounced;
}

export function HeaderSearch() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

  const term = query.trim();
  const debouncedTerm = useDebouncedValue(term, 200);

  const { data } = useQuery({
    queryKey: queryKeys.products.suggestions(debouncedTerm),
    queryFn: ({ signal }) => fetchSearchSuggestions(debouncedTerm, 6, signal),
    enabled: debouncedTerm.length > 0
  });

  const results = term ? data ?? [] : [];

  React.useEffect(() => {
    setHighlightedIndex(-1);
  }, [results]);

  React.useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function goToResults(overrideTerm?: string) {
    const value = (overrideTerm ?? query).trim();
    if (!value) return;
    router.push(`/shop?search=${encodeURIComponent(value)}`);
    setIsOpen(false);
    setQuery("");
  }

  function goToProduct(slug: string) {
    router.push(`/shop/${slug}`);
    setIsOpen(false);
    setQuery("");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (highlightedIndex >= 0 && results[highlightedIndex]) {
      goToProduct(results[highlightedIndex].slug);
      return;
    }
    goToResults();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen((value) => !value)}
        aria-label="Search"
        aria-expanded={isOpen}
        className="flex h-10 w-10 items-center justify-center rounded-full text-charcoal hover:bg-charcoal/5"
      >
        <Search className="h-[18px] w-[18px]" />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Search fabrics"
          className="absolute right-0 top-12 w-80 rounded-card border border-charcoal/10 bg-white p-3 shadow-lg"
        >
          <form onSubmit={handleSubmit} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/40" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search fabrics..."
              aria-label="Search fabrics"
              role="combobox"
              aria-expanded={results.length > 0}
              aria-activedescendant={highlightedIndex >= 0 ? `search-suggestion-${highlightedIndex}` : undefined}
              className="h-10 w-full rounded-lg border border-charcoal/15 bg-white pl-9 pr-8 text-sm text-charcoal placeholder:text-charcoal/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-charcoal/40 hover:text-charcoal"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </form>

          {term && (
            <div className="mt-2">
              {results.length === 0 ? (
                <p className="px-1 py-3 text-center text-xs text-charcoal/50">No fabrics match &ldquo;{query}&rdquo;.</p>
              ) : (
                <ul role="listbox" className="divide-y divide-charcoal/5">
                  {results.map((product, index) => (
                    <li key={product.id} id={`search-suggestion-${index}`} role="option" aria-selected={index === highlightedIndex}>
                      <Link
                        href={`/shop/${product.slug}`}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        onClick={() => {
                          setIsOpen(false);
                          setQuery("");
                        }}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-2 py-2 text-sm",
                          index === highlightedIndex ? "bg-forest/8" : "hover:bg-charcoal/5"
                        )}
                      >
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-sand/40">
                          {product.image && (

                            <img src={product.image} alt="" className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-charcoal">{product.name}</p>
                          <p className="truncate text-xs text-charcoal/45">{product.category}</p>
                        </div>
                        <span className="shrink-0 text-xs text-charcoal/50">{formatPrice(product.price)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <button
                onClick={() => goToResults()}
                className="mt-1 w-full rounded-lg px-2 py-2 text-left text-xs font-medium text-forest hover:bg-forest/5"
              >
                See all results for &ldquo;{query}&rdquo;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
