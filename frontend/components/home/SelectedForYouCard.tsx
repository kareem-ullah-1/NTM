"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Star } from "lucide-react";
import type { Product } from "@/types/product";
import { formatPrice, cn } from "@/lib/utils";
import { getPromotionForProduct } from "@/lib/api/promotions";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/store/use-cart-store";
import { useToastStore } from "@/store/use-toast-store";

type SelectedForYouCardProps = {
  product: Product;
  className?: string;
};

export function SelectedForYouCard({ product, className }: SelectedForYouCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const openCartDrawer = useCartStore((state) => state.openCartDrawer);
  const showToast = useToastStore((state) => state.showToast);
  const outOfStock = product.stock === 0;

  const [selectedColorName, setSelectedColorName] = React.useState(
    product.colors[0]?.name ?? ""
  );

  const selectedColorObj = React.useMemo(() => {
    return product.colors.find(
      (c) => c.name.toLowerCase() === selectedColorName.toLowerCase()
    );
  }, [product.colors, selectedColorName]);

  const displayImage =
    selectedColorObj?.image ||
    (selectedColorObj?.images && selectedColorObj.images[0]) ||
    product.images[0] ||
    null;

  function handleColorSelect(event: React.MouseEvent | React.KeyboardEvent, colorName: string) {
    event.preventDefault();
    event.stopPropagation();
    setSelectedColorName(colorName);
  }

  const { data: promotion } = useQuery({
    queryKey: ["promotions", "product", product.id],
    queryFn: () => getPromotionForProduct(product.id),
    staleTime: 30_000
  });
  const activePromo = promotion?.isActive ? promotion : null;

  const MAX_SWATCHES = 4;
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

  function handleAddToCart(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const promoDiscountPerUnit = activePromo
      ? activePromo.discountType === "percentage"
        ? product.price * (activePromo.discountValue / 100)
        : activePromo.discountValue
      : 0;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: displayImage || product.images[0],
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

  return (
    <div
      className={cn(
        "group flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
        className
      )}
    >
      <div className="relative block aspect-[4/5] overflow-hidden bg-charcoal/[0.03]">
        <Link
          href={`/shop/${product.slug}`}
          className="absolute inset-0 z-0 block"
          aria-label={product.name}
        >
          {displayImage && (
            <Image
              key={displayImage}
              src={displayImage}
              alt={`${product.name}${selectedColorObj?.name ? ` - ${selectedColorObj.name}` : ""}`}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 75vw"
              className={cn(
                "object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.03]",
                outOfStock && "opacity-70"
              )}
            />
          )}
        </Link>

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

      <div className="flex flex-col gap-1.5 pt-4">
        <Link
          href={`/shop/${product.slug}`}
          className="truncate font-serif text-[14px] font-semibold uppercase tracking-wide text-charcoal transition-colors duration-200 group-hover:text-forest"
        >
          {product.name}
        </Link>

        <p className="truncate text-[11px] uppercase tracking-wide text-charcoal/40">
          {product.category} | {product.fabricType}
        </p>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {strikePrice !== null && (
            <span className="text-xs text-charcoal/35 line-through">
              {formatPrice(strikePrice)}
            </span>
          )}
          <span className="text-sm font-semibold text-charcoal">
            {formatPrice(salePrice ?? product.price)}
          </span>
          {percentOff !== null && percentOff > 0 && (
            <span className="text-xs font-medium text-rust-dark">-{percentOff}%</span>
          )}
          <span
            className="pointer-events-none inline-flex items-center gap-0.5 text-[11px] text-charcoal/45"
            role="img"
            aria-label={
              (product.reviewCount ?? 0) > 0
                ? `Rated ${Number(product.rating).toFixed(1)} out of 5 from ${product.reviewCount} reviews`
                : "No reviews yet"
            }
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

        {visibleColors.length > 0 && (
          <div className="relative z-10 mt-0.5 flex items-center gap-1.5">
            {product.colors.length <= 1 ? (
              (() => {
                const colorThumb =
                  visibleColors[0].image ||
                  (visibleColors[0].images && visibleColors[0].images[0]) ||
                  product.images[0] ||
                  null;
                return (
                  <span className="relative h-[20px] w-[20px] shrink-0 overflow-hidden rounded-[4px] ring-1 ring-charcoal/10">
                    {colorThumb ? (
                      // eslint-disable-next-line @next/next/no-img-element -- tiny
                      <img
                        src={colorThumb}
                        alt={visibleColors[0].name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span
                        className="block h-full w-full"
                        style={{ backgroundColor: visibleColors[0].hex }}
                      />
                    )}
                  </span>
                );
              })()
            ) : (
              <div className="flex items-center gap-1">
                {visibleColors.map((color, index) => {
                  const isSelected = color.name === selectedColorName;
                  const colorThumb =
                    color.image || (color.images && color.images[0]) || product.images[0] || null;
                  return (
                    <button
                      key={`${color.hex}-${index}`}
                      type="button"
                      title={color.name}
                      aria-label={`Select ${color.name}`}
                      aria-pressed={isSelected}
                      onClick={(event) => handleColorSelect(event, color.name)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          handleColorSelect(event, color.name);
                        }
                      }}
                      className={cn(
                        "relative h-[20px] w-[20px] shrink-0 overflow-hidden rounded-[4px] outline-none transition-transform duration-200",
                        "ring-1 ring-charcoal/10 hover:scale-105",
                        "focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-1",
                        isSelected && "ring-2 ring-charcoal"
                      )}
                    >
                      {colorThumb ? (
                        // eslint-disable-next-line @next/next/no-img-element -- tiny
                        <img src={colorThumb} alt={color.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="block h-full w-full" style={{ backgroundColor: color.hex }} />
                      )}
                      <span className="sr-only">{isSelected ? "Selected" : ""}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {extraColorCount > 0 && (
              <span className="text-[10px] font-medium text-charcoal/40" aria-hidden="true">
                +{extraColorCount}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
