"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useReducedMotion } from "framer-motion";
import { fetchActivePromotions } from "@/lib/api/promotions";
import { queryKeys } from "@/lib/api/query-keys";
import { CountdownTimer } from "@/components/shared/CountdownTimer";
import { FadeUp } from "@/components/motion/reveal";
import { formatPrice, cn } from "@/lib/utils";
import type { ApiPromotion } from "@/lib/api/promotions";

export function PromoSection() {
  const { data: promos = [], isLoading } = useQuery({
    queryKey: queryKeys.promotions.active,
    queryFn: fetchActivePromotions
  });

  if (isLoading || promos.length === 0) return null;

  const promo =
    promos.find((p) => p.videoUrl || (p.displayProducts && p.displayProducts.length > 0)) ??
    promos[0];

  return <PromoBlock promo={promo} />;
}


function PromoBlock({ promo }: { promo: ApiPromotion }) {
  const reduced = useReducedMotion();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = React.useState(false);
  const [videoFailed, setVideoFailed] = React.useState(false);

  const hasVideo = !!promo.videoUrl && !videoFailed;

  React.useEffect(() => {
    if (!hasVideo || reduced) return;
    const videoEl = videoRef.current;
    if (!videoEl) return;
    const playPromise = videoEl.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
      });
    }
  }, [hasVideo, reduced, promo.videoUrl]);

  const hasDisplayProducts =
    promo.displayProducts && promo.displayProducts.length > 0;

  const offerHref = hasDisplayProducts
    ? `/shop?promotion=${promo.id}&ids=${promo.displayProducts!.map((p) => p.id).join(",")}`
    : `/shop?promotion=${promo.id}`;

  const discountLabel =
    promo.discountType === "percentage"
      ? `Flat ${promo.discountValue}% Off`
      : `Save ${formatPrice(promo.discountValue)}`;

  return (
    <section className="w-full" aria-label="Current promotion">
      {/* ── Video / Poster Hero Banner ──────────────────────── */}
      <FadeUp>
        <div className="relative w-full overflow-hidden bg-charcoal">
          <div className="relative w-full pt-[42%] max-md:pt-[56%]">
            {hasVideo ? (
              <>
                {promo.videoPosterUrl && !videoLoaded && (
                  <Image
                    src={promo.videoPosterUrl}
                    alt=""
                    fill
                    sizes="100vw"
                    className="object-cover"
                    aria-hidden="true"
                  />
                )}
                <video
                  ref={videoRef}
                  src={promo.videoUrl!}
                  poster={promo.videoPosterUrl ?? undefined}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload={reduced ? "none" : "metadata"}
                  onLoadedData={() => setVideoLoaded(true)}
                  onError={() => setVideoFailed(true)}
                  className={cn(
                    "absolute inset-0 h-full w-full object-cover",
                    videoLoaded ? "opacity-100" : "opacity-0",
                    "transition-opacity duration-1000"
                  )}
                  aria-label={`Promotional video for ${promo.name}`}
                />
              </>
            ) : promo.videoPosterUrl ? (
              <Image
                src={promo.videoPosterUrl}
                alt={`${promo.name} promotion`}
                fill
                sizes="100vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-charcoal via-charcoal-light to-charcoal" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/10 to-charcoal/30" />

            <div className="absolute inset-0 flex items-center">
              <div className="w-full px-6 sm:px-10 md:px-14 lg:px-20">
                <div className="mx-auto max-w-[1400px]">
                  <span className="mb-4 inline-flex items-center gap-2 border border-cream/25 px-3 py-1 text-overline uppercase tracking-wider text-cream/80">
                    Promotion
                  </span>
                  <h2 className="font-serif text-display-lg uppercase tracking-tight text-cream sm:text-display-xl lg:text-[64px] lg:leading-[0.95]">
                    {promo.name}
                  </h2>
                  <p className="mt-3 font-serif text-display-md uppercase tracking-tight text-rust sm:text-display-lg">
                    {discountLabel}
                  </p>
                  {promo.description && (
                    <p className="mt-4 max-w-md text-[14px] leading-relaxed text-cream/70">
                      {promo.description}
                    </p>
                  )}
                  <div className="mt-7 flex flex-wrap items-center gap-5">
                    <Link
                      href={offerHref}
                      className="inline-flex items-center gap-2 rounded-full bg-cream px-8 py-3.5 text-[13px] font-medium text-charcoal transition-colors hover:bg-cream-dark"
                    >
                      Shop the Offer
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href="/shop"
                      className="inline-flex items-center gap-1.5 text-[13px] font-medium text-cream/80 transition-colors hover:text-cream"
                    >
                      View All
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                    {promo.expiresAt && (
                      <div className="text-cream/50">
                        <CountdownTimer
                          targetDate={promo.expiresAt}
                          label="Ends in"
                          expiredLabel="Offer ended"
                          size="sm"
                          className="[&_p]:text-cream/50 [&_span]:text-cream/50 [&_div>div]:bg-cream/10 [&_div>div]:text-cream/70"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* ── Featured Products Rail ───────────────────────────── */}
      {hasDisplayProducts && (
        <FadeUp delay={0.15}>
          <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 lg:px-12">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <span className="text-overline uppercase tracking-wider text-rust">
                  <span className="mr-2 inline-block h-px w-5 bg-rust/40" aria-hidden="true" />
                  Shop the Promotion
                </span>
                <h3 className="mt-2 font-serif text-display-sm text-charcoal sm:text-display-md">
                  Featured Selections
                </h3>
              </div>
              <Link
                href="/shop"
                className="hidden items-center gap-1.5 text-[12px] font-medium text-charcoal/50 transition-colors hover:text-charcoal sm:inline-flex"
              >
                View All
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div
              className={cn(
                "flex gap-4 overflow-x-auto pb-4",
                "snap-x snap-mandatory scroll-smooth scrollbar-hide",
                "lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0"
              )}
              role="region"
              aria-label="Featured promotion products"
            >
              {promo.displayProducts!.map((product, index) => (
                <PromoProductCard
                  key={product.id}
                  product={product}
                  promotion={promo}
                  index={index}
                />
              ))}
            </div>
          </div>
        </FadeUp>
      )}
    </section>
  );
}


type DisplayProduct = NonNullable<ApiPromotion["displayProducts"]>[number];

function PromoProductCard({
  product,
  promotion,
}: {
  product: DisplayProduct;
  promotion: ApiPromotion;
  index: number;
}) {
  const slug = product.slug ?? product.id;
  const image = product.images?.[0] ?? product.image ?? null;
  const hasPromotion =
    promotion.discountType === "percentage" || promotion.discountType === "fixed";

  const salePrice = hasPromotion
    ? promotion.discountType === "percentage"
      ? product.price * (1 - promotion.discountValue / 100)
      : Math.max(0, product.price - promotion.discountValue)
    : null;

  return (
    <Link
      href={`/shop/${slug}`}
      className={cn(
        "group flex-shrink-0 snap-start",
        "w-[260px] sm:w-[280px] lg:w-full"
      )}
      style={{ minWidth: "220px" }}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-charcoal/[0.03]">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 60vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[12px] text-charcoal/30">
            No image
          </div>
        )}

        {hasPromotion && (
          <span className="absolute left-3 top-3 rounded-full bg-rust px-3 py-1 text-[10px] font-medium tracking-wide text-cream">
            {promotion.discountType === "percentage"
              ? `${promotion.discountValue}% OFF`
              : `${formatPrice(promotion.discountValue)} OFF`}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-between bg-cream/80 px-4 py-3 backdrop-blur-md transition-transform duration-[250ms] ease-out group-hover:translate-y-0 [@media(hover:none)]:translate-y-0">
          <span className="text-[12px] font-medium uppercase tracking-wide text-charcoal">
            View Details
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-charcoal" />
        </div>
      </div>

      <div className="flex flex-col gap-1 pt-3">
        <p className="truncate font-serif text-[14px] font-bold uppercase text-charcoal transition-colors duration-200 group-hover:text-forest">
          {product.name}
        </p>
        {product.category && product.fabricType && (
          <p className="text-[10px] uppercase tracking-wide text-charcoal/40">
            {product.category} | {product.fabricType}
          </p>
        )}
        <div className="mt-1 flex items-center gap-2">
          {salePrice !== null && salePrice < product.price && (
            <span className="text-xs text-charcoal/35 line-through">
              {formatPrice(product.price)}
            </span>
          )}
          <span className="text-[13px] font-bold text-charcoal">
            {salePrice !== null && salePrice < product.price
              ? formatPrice(salePrice)
              : formatPrice(product.price)}
          </span>
        </div>
      </div>
    </Link>
  );
}
