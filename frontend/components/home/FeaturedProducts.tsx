"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchFeaturedProducts } from "@/lib/api/products";
import { queryKeys } from "@/lib/api/query-keys";
import { SelectedForYouCard } from "@/components/home/SelectedForYouCard";
import { ProductCardSkeleton } from "@/components/shared/product-card-skeleton";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

const CARD_GAP_PX = 16; // matches gap-4

export function FeaturedProducts() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: queryKeys.products.featured(8),
    queryFn: ({ signal }) => fetchFeaturedProducts(8, signal),
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const [activePage, setActivePage] = useState(0);

  const recomputePages = useCallback(() => {
    const el = scrollRef.current;
    if (!el || products.length === 0) {
      setPageCount(1);
      return;
    }
    const firstCard = el.querySelector<HTMLElement>(":scope > div");
    if (!firstCard) {
      setPageCount(1);
      return;
    }
    const cardWidth = firstCard.offsetWidth + CARD_GAP_PX;
    const cardsPerView = Math.max(1, Math.round(el.clientWidth / cardWidth));
    setPageCount(Math.max(1, Math.ceil(products.length / cardsPerView)));
  }, [products.length]);

  const updateActivePage = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 1) {
      setActivePage(0);
      return;
    }
    const progress = el.scrollLeft / maxScroll;
    setActivePage((prev) => {
      const next = Math.round(progress * (pageCount - 1));
      return next === prev ? prev : next;
    });
  }, [pageCount]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    recomputePages();
    updateActivePage();

    const onScroll = () => updateActivePage();
    el.addEventListener("scroll", onScroll, { passive: true });

    const onResize = () => {
      recomputePages();
      updateActivePage();
    };
    window.addEventListener("resize", onResize);

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [recomputePages, updateActivePage, isLoading]);

  const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return;

    const atStart = el.scrollLeft <= 0 && event.deltaY < 0;
    const atEnd = el.scrollLeft >= maxScroll - 1 && event.deltaY > 0;
    if (atStart || atEnd) return; // let the page scroll once the rail is exhausted

    event.preventDefault();
    el.scrollLeft += event.deltaY;
  }, []);

  const goToPage = useCallback(
    (page: number) => {
      const el = scrollRef.current;
      if (!el) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;
      const target = pageCount > 1 ? (page / (pageCount - 1)) * maxScroll : 0;
      el.scrollTo({ left: target, behavior: "smooth" });
    },
    [pageCount]
  );

  if (!isLoading && products.length === 0) return null;

  const cardWidthClass =
    "w-[min(280px,75vw)] shrink-0 sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)]";

  return (
    <section className="mx-auto max-w-[1400px] overflow-x-hidden px-5 py-24 sm:px-8 lg:px-12">
      <FadeUp>
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <span className="inline-flex items-center gap-2 text-overline uppercase text-rust-dark">
            <span className="h-px w-6 bg-rust-dark/40" aria-hidden="true" />
            Handpicked For You
            <span className="h-px w-6 bg-rust-dark/40" aria-hidden="true" />
          </span>
          <h2 className="font-serif text-display-lg text-charcoal sm:text-display-xl">
            Selected For You
          </h2>
          <p className="max-w-md text-[14px] text-charcoal/55">
            Premium fabrics chosen just for you — timeless quality, modern style.
          </p>
        </div>
      </FadeUp>

      <FadeUp delay={0.08}>
        <StaggerContainer>
          <div
            ref={scrollRef}
            onWheel={handleWheel}
            className="scrollbar-hide flex snap-x snap-proximity gap-4 overflow-x-auto pb-2 pt-1"
            style={{ touchAction: "pan-x", WebkitOverflowScrolling: "touch" }}
          >
            {isLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className={cardWidthClass}>
                    <ProductCardSkeleton />
                  </div>
                ))
              : products.map((product) => (
                  <StaggerItem
                    key={product.id}
                    className={cn(cardWidthClass, "snap-start")}
                  >
                    <SelectedForYouCard product={product} />
                  </StaggerItem>
                ))}
          </div>
        </StaggerContainer>
      </FadeUp>

      {!isLoading && pageCount > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {Array.from({ length: pageCount }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToPage(index)}
              aria-label={`Go to product page ${index + 1} of ${pageCount}`}
              aria-current={activePage === index}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                activePage === index ? "w-5 bg-charcoal" : "w-1.5 bg-charcoal/20"
              )}
            />
          ))}
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <Link
          href="/shop"
          className={cn(
            "group inline-flex items-center gap-2 rounded-sm border border-charcoal bg-charcoal px-8 py-3.5",
            "text-[13px] font-medium uppercase tracking-[0.08em] text-cream",
            "transition-all duration-300 ease-out",
            "hover:scale-[1.015] hover:bg-cream hover:text-charcoal"
          )}
        >
          View All
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
        </Link>
      </div>
    </section>
  );
}
