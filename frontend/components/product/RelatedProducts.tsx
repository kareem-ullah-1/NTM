"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/types/product";
import { ProductCard } from "@/components/shared/product-card";
import { FadeUp } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

export function RelatedProducts({
  products,
  title = "You May Also Like"
}: {
  products: Product[];
  title?: string;
}) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const updateScrollState = React.useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  React.useEffect(() => {
    updateScrollState();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, products.length]);

  function scrollByCard(direction: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-related-card]");
    const cardWidth = card ? card.offsetWidth + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: direction * cardWidth, behavior: "smooth" });
  }

  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1400px] border-t border-charcoal/[0.04] px-5 py-16 sm:px-8 lg:px-12">
      <FadeUp>
        <div className="mb-8 flex items-end justify-between">
          <div className="text-center sm:text-left">
            <span className="mb-2 inline-flex items-center gap-2 text-overline uppercase text-rust-dark">
              <span className="h-px w-5 bg-rust-dark/40" aria-hidden="true" />
              Discover More
            </span>
            <h2 className="font-serif text-display-md text-charcoal sm:text-display-lg">
              {title}
            </h2>
          </div>

          {/* Arrow controls — desktop only, hidden on touch-first mobile */}
          {products.length > 1 && (
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={() => scrollByCard(-1)}
                disabled={!canScrollLeft}
                aria-label="Scroll to previous products"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-charcoal/12 text-charcoal/50 transition-colors hover:border-charcoal/30 hover:text-charcoal disabled:pointer-events-none disabled:opacity-25"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollByCard(1)}
                disabled={!canScrollRight}
                aria-label="Scroll to next products"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-charcoal/12 text-charcoal/50 transition-colors hover:border-charcoal/30 hover:text-charcoal disabled:pointer-events-none disabled:opacity-25"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </FadeUp>

      <div
        ref={trackRef}
        className={cn(
          "flex gap-5 overflow-x-auto pb-2",
          "snap-x snap-mandatory scroll-smooth scrollbar-hide"
        )}
        role="region"
        aria-label={title}
      >
        {products.map((product) => (
          <div
            key={product.id}
            data-related-card
            className="w-[220px] shrink-0 snap-start sm:w-[260px] lg:w-[calc(25%-15px)]"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
