"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Layers } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { StaggerContainer, StaggerItem } from "@/components/motion/reveal";
import { fetchHomeFeaturedCategories } from "@/lib/api/store";
import { queryKeys } from "@/lib/api/query-keys";

export function CategoryCards() {
  const reduced = useReducedMotion();
  const {
    data: homeFeatured = [],
    isLoading,
    isError
  } = useQuery({
    queryKey: queryKeys.store.homeFeatured,
    queryFn: fetchHomeFeaturedCategories,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  if (isLoading) {
    return (
      <section className="relative bg-cream pb-12 pt-12 sm:pb-14 sm:pt-14 lg:pb-20 lg:pt-16">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div className="mb-8 sm:mb-10">
            <div className="h-3 w-36 animate-pulse rounded bg-charcoal/10" />
            <div className="mt-3 h-8 w-56 animate-pulse rounded bg-charcoal/10 sm:h-9" />
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4 lg:gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="aspect-[4/5] animate-pulse rounded-xl bg-charcoal/[0.06] sm:rounded-2xl sm:aspect-[3/4]"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (isError || !homeFeatured || homeFeatured.length === 0) {
    return null;
  }

  const displayCategories = homeFeatured.filter(
    (hfc) =>
      hfc.isActive &&
      hfc.category &&
      hfc.category.isEnabled &&
      Boolean(hfc.category.name)
  );

  if (displayCategories.length === 0) {
    return null;
  }

  const homepageCategories = displayCategories.slice(0, 4);

  return (
    <motion.section
      className="relative bg-cream pb-12 pt-12 sm:pb-14 sm:pt-14 lg:pb-20 lg:pt-16"
      initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: reduced ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
        {/* Section heading above the category grid */}
        <div className="mb-8 sm:mb-10 lg:mb-12">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: reduced ? 0 : 0.05, duration: reduced ? 0 : 0.4 }}
            className="inline-block text-overline uppercase tracking-widest text-charcoal/40"
          >
            Browse our collection
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: reduced ? 0 : 0.1, duration: reduced ? 0 : 0.4 }}
            className="mt-3 font-serif text-2xl font-medium tracking-tight text-charcoal sm:text-3xl lg:text-[2rem]"
          >
            Shop by Categories
          </motion.h2>
        </div>

        <StaggerContainer className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4 lg:gap-4">
          {homepageCategories.map((hfc) => {
            const categoryName = hfc.category?.name ?? "";
            const imageUrl = hfc.imageUrl || hfc.category?.imageUrl;
            const href = `/shop?category=${encodeURIComponent(categoryName)}`;

            return (
              <StaggerItem key={hfc.id}>
                <Link
                  href={href}
                  className="group relative block aspect-[4/5] overflow-hidden rounded-xl bg-charcoal/5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.2)] ring-1 ring-charcoal/[0.06] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:rounded-2xl sm:aspect-[3/4]"
                >
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={categoryName}
                      fill
                      sizes="(min-width: 1024px) 25vw, 50vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-charcoal/90 via-charcoal to-charcoal/95 p-6 text-center">
                      <Layers className="mb-2 h-8 w-8 text-cream/20" />
                      <span className="font-serif text-sm tracking-wide text-cream/40">
                        NTM Fabrics
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent transition-colors duration-300 group-hover:from-black/85" />

                  <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center sm:p-4">
                    <p className="text-center text-[12px] font-bold uppercase tracking-[0.12em] text-white drop-shadow-md sm:text-[14px] sm:tracking-[0.14em]">
                      {categoryName}
                    </p>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </motion.section>
  );
}
