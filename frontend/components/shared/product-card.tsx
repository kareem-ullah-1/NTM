"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@/types/product";
import { formatPrice, cn } from "@/lib/utils";
import { InlineCountdown } from "@/components/shared/CountdownTimer";
import { useCartStore } from "@/store/use-cart-store";
import { useToastStore } from "@/store/use-toast-store";
import dynamic from "next/dynamic";
import { getPromotionForProduct } from "@/lib/api/promotions";
import type { ApiPromotionWithStatus } from "@/lib/api/promotions";

const QuickViewModal = dynamic(
  () => import("@/components/product/QuickViewModal").then((m) => m.QuickViewModal),
  { ssr: false }
);

type ProductCardProps = {
  product: Product;
  className?: string;
  promotion?: ApiPromotionWithStatus | null;
};

function ProductCardComponent({ product, className, promotion: promoProp }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const openCartDrawer = useCartStore((state) => state.openCartDrawer);
  const showToast = useToastStore((state) => state.showToast);
  const outOfStock = product.stock === 0;

  const [selectedColorName, setSelectedColorName] = React.useState(
    product.colors[0]?.name ?? ""
  );
  const [hoveredColorName, setHoveredColorName] = React.useState<string | null>(null);

  const selectedColorObj = React.useMemo(() => {
    return product.colors.find(
      (c) => c.name.toLowerCase() === selectedColorName.toLowerCase()
    );
  }, [product.colors, selectedColorName]);

  const hoveredColorObj = React.useMemo(() => {
    if (!hoveredColorName) return undefined;
    return product.colors.find(
      (c) => c.name.toLowerCase() === hoveredColorName.toLowerCase()
    );
  }, [product.colors, hoveredColorName]);

  const previewColorObj = hoveredColorObj ?? selectedColorObj;

  const displayImage =
    previewColorObj?.image ||
    (previewColorObj?.images && previewColorObj.images[0]) ||
    product.images[0] ||
    null;

  function handleColorSelect(event: React.MouseEvent | React.KeyboardEvent, colorName: string) {
    event.preventDefault();
    event.stopPropagation();
    setSelectedColorName(colorName);
  }

  const { data: fetchedPromotion } = useQuery({
    queryKey: ["promotions", "product", product.id],
    queryFn: () => getPromotionForProduct(product.id),
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    enabled: promoProp === undefined
  });
  const promotion = promoProp !== undefined ? promoProp : fetchedPromotion ?? null;
  const activePromo = promotion?.isActive ? promotion : null;

  function handleAddToCart(event: React.MouseEvent) {
    event.preventDefault();
    const promoDiscountPerUnit = activePromo
      ? activePromo.discountType === "percentage"
        ? product.price * (activePromo.discountValue / 100)
        : activePromo.discountValue
      : 0;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: displayImage || "",
      selectedColor: selectedColorName || "Default",
      selectedLength: product.availableLengths[0] ?? "4 meters",
      quantity: 1,
      unitPrice: product.price - promoDiscountPerUnit,
      promotionId: activePromo?.id,
      promotionName: activePromo?.name,
      promoDiscountPerUnit: activePromo ? promoDiscountPerUnit : undefined
    });
    showToast(`${product.name} added to cart`);
    openCartDrawer();
  }

  const MAX_SWATCHES = 5;
  const visibleColors = product.colors.slice(0, MAX_SWATCHES);
  const extraColorCount = product.colors.length - visibleColors.length;

  const salePrice = activePromo
    ? product.price -
      (activePromo.discountType === "percentage"
        ? product.price * (activePromo.discountValue / 100)
        : activePromo.discountValue)
    : product.originalPrice
      ? product.price
      : null;
  const strikePrice = activePromo ? product.price : product.originalPrice ?? null;
  const percentOff = activePromo
    ? activePromo.discountType === "percentage"
      ? Math.round(activePromo.discountValue)
      : Math.round((activePromo.discountValue / product.price) * 100)
    : product.originalPrice
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  return (
    <div
      className={cn(
        "group relative flex flex-col transition-transform duration-300 ease-out motion-safe:hover:-translate-y-1",
        className
      )}
    >
      {}
      <div className="relative block aspect-[3/4] overflow-hidden rounded-xl bg-charcoal/[0.03] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-300 group-hover:shadow-[0_16px_32px_-16px_rgba(0,0,0,0.25)]">
        <Link
          href={`/shop/${product.slug}`}
          className="absolute inset-0 z-0 block"
          aria-label={product.name}
        >
          {displayImage && (
            <AnimatePresence initial={false} mode="sync">
              <motion.div
                key={displayImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <Image
                  src={displayImage}
                  alt={`${product.name}${previewColorObj?.name ? ` - ${previewColorObj.name}` : ""}`}
                  fill
                  sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  quality={80}
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </motion.div>
            </AnimatePresence>
          )}
        </Link>

        {}
        <div className="absolute inset-0 z-10 pointer-events-none [&>*]:pointer-events-auto">
          <QuickViewModal product={product} />
        </div>

        {}
        {!outOfStock && (
          <button
            type="button"
            onClick={handleAddToCart}
            className={cn(
              "absolute inset-x-0 bottom-0 z-10 flex items-center justify-between px-4 py-3",
              "bg-cream/80 backdrop-blur-md",
              "translate-y-full transition-transform duration-[250ms] ease-out",
              "group-hover:translate-y-0",
              "[@media(hover:none)]:translate-y-0"
            )}
          >
            <span className="text-[12px] font-medium uppercase tracking-wide text-charcoal">
              Add to Cart
            </span>
            <ShoppingBag className="h-4 w-4 text-charcoal" />
          </button>
        )}
      </div>

      {}
      <div className="flex flex-col gap-1 pt-3 relative z-0">
        <Link
          href={`/shop/${product.slug}`}
          className="truncate font-serif text-[15px] font-bold uppercase text-charcoal transition-colors duration-200 hover:text-forest"
        >
          {product.name}
        </Link>
        <p className="text-[11px] uppercase tracking-wide text-charcoal/40">
          {product.category} | {product.fabricType}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {strikePrice !== null && (
            <span className="text-xs text-charcoal/35 line-through">
              {formatPrice(strikePrice)}
            </span>
          )}
          <span className="text-sm font-bold text-charcoal">
            {formatPrice(salePrice ?? product.price)}
          </span>
          {percentOff !== null && percentOff > 0 && (
            <span className="text-xs text-charcoal/50">-{percentOff}%</span>
          )}
          {/* Compact rating beside price — same product.rating / reviewCount API data */}
          <span
            className="pointer-events-none inline-flex items-center gap-0.5 text-[11px] text-charcoal/45"
            aria-label={
              (product.reviewCount ?? 0) > 0
                ? `Rated ${Number(product.rating).toFixed(1)} out of 5 from ${product.reviewCount} reviews`
                : "No reviews yet"
            }
            role="img"
          >
            {(product.reviewCount ?? 0) > 0 ? (
              <>
                <Star
                  width={11}
                  height={11}
                  className="fill-sand text-sand"
                  aria-hidden
                />
                <span className="tabular-nums text-charcoal/55">
                  {Number(product.rating).toFixed(1)}
                </span>
                <span className="text-charcoal/40">({product.reviewCount})</span>
              </>
            ) : (
              <span className="text-charcoal/35">No reviews</span>
            )}
          </span>
        </div>

        {activePromo && activePromo.expiresAt && (
          <InlineCountdown targetDate={activePromo.expiresAt} />
        )}

        {}
        {visibleColors.length > 0 && (
          <div className="relative z-10 mt-1.5 flex items-center gap-1">
            {visibleColors.map((color, index) => {
              const isSelected = color.name === selectedColorName;
              const colorThumb =
                color.image || (color.images && color.images[0]) || product.images[0] || null;

              if (product.colors.length <= 1) {
                return (
                  <span
                    key={`${color.hex}-${index}`}
                    title={color.name}
                    className="relative h-[22px] w-[22px] shrink-0 overflow-hidden rounded-[4px] ring-1 ring-charcoal/10"
                  >
                    {colorThumb ? (
                      // eslint-disable-next-line @next/next/no-img-element -- tiny fixed-size
                      <img src={colorThumb} alt={color.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="block h-full w-full" style={{ backgroundColor: color.hex }} />
                    )}
                  </span>
                );
              }

              const hasImage = Boolean(color.image || (color.images && color.images[0]));
              return (
                <button
                  key={`${color.hex}-${index}`}
                  type="button"
                  title={hasImage ? color.name : `${color.name} (no photo uploaded)`}
                  aria-label={`Select ${color.name}`}
                  aria-pressed={isSelected}
                  onClick={(event) => handleColorSelect(event, color.name)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      handleColorSelect(event, color.name);
                    }
                  }}
                  onMouseEnter={() => setHoveredColorName(color.name)}
                  onMouseLeave={() => setHoveredColorName(null)}
                  onFocus={() => setHoveredColorName(color.name)}
                  onBlur={() => setHoveredColorName(null)}
                  className={cn(
                    "relative h-[22px] w-[22px] shrink-0 overflow-hidden rounded-[4px] outline-none transition-transform duration-200",
                    "ring-1 ring-charcoal/10 hover:scale-105",
                    "focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-1",
                    isSelected && "ring-2 ring-charcoal"
                  )}
                >
                  {colorThumb ? (
                    // eslint-disable-next-line @next/next/no-img-element -- tiny fixed-size
                    <img src={colorThumb} alt={color.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="block h-full w-full" style={{ backgroundColor: color.hex }} />
                  )}
                  <span className="sr-only">{isSelected ? "Selected" : ""}</span>
                </button>
              );
            })}
            {extraColorCount > 0 && (
              <span className="text-[10px] text-charcoal/40">+{extraColorCount}</span>
            )}
          </div>
        )}

        {outOfStock && (
          <span className="mt-1.5 inline-flex w-fit items-center rounded-full border border-red-100 bg-red-50/80 px-3 py-1 text-[11px] font-medium text-red-400">
            Sold Out
          </span>
        )}

      </div>
    </div>
  );
}

export const ProductCard = React.memo(ProductCardComponent);
