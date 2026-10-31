"use client";

import * as React from "react";
import Image from "next/image";
import { Check, Minus, Plus, ShoppingBag, Timer, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { Product } from "@/types/product";
import { formatPrice, cn } from "@/lib/utils";
import { RatingStars } from "@/components/shared/RatingStars";
import { CountdownTimer } from "@/components/shared/CountdownTimer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/use-cart-store";
import { useToastStore } from "@/store/use-toast-store";
import { getPromotionForProduct } from "@/lib/api/promotions";
import type { ApiPromotionWithStatus } from "@/lib/api/promotions";
import { FabricDetails } from "@/components/product/FabricDetails";

type ProductInfoProps = {
  product: Product;
  selectedColor?: string;
  onColorChange?: (color: string) => void;
  activeImage?: string;
};

const LIGHT_SWATCH_HEXES = ["#FFFFFF", "#FAFAFA", "#F5F5DC", "#FAF8F3"];

export function ProductInfo({
  product,
  selectedColor: controlledColor,
  onColorChange,
  activeImage
}: ProductInfoProps) {
  const { data: promotion } = useQuery({
    queryKey: ["promotions", "product", product.id],
    queryFn: () => getPromotionForProduct(product.id),
    staleTime: 30_000
  });
  const activePromo = promotion?.isActive ? promotion : null;

  const firstAvailableColor =
    product.colors.find((c) => (c.stock ?? 0) > 0)?.name ??
    product.colors[0]?.name ??
    "";

  const [internalColor, setInternalColor] = React.useState(firstAvailableColor);
  const color = controlledColor !== undefined ? controlledColor : internalColor;

  function handleColorChange(newColor: string) {
    const option = product.colors.find((c) => c.name === newColor);
    if (option && (option.stock ?? 0) <= 0) return;
    if (onColorChange) {
      onColorChange(newColor);
    } else {
      setInternalColor(newColor);
    }
  }

  const selectedLength = product.availableLengths[0] ?? "";

  const selectedColorOption = product.colors.find((c) => c.name === color);
  const availableStock =
    product.colors.length > 0
      ? selectedColorOption?.stock ?? 0
      : product.stock;

  // If current colour is sold out, move to first available
  React.useEffect(() => {
    if (product.colors.length === 0) return;
    const current = product.colors.find((c) => c.name === color);
    if (current && (current.stock ?? 0) > 0) return;
    const next = product.colors.find((c) => (c.stock ?? 0) > 0);
    if (next) {
      if (onColorChange) onColorChange(next.name);
      else setInternalColor(next.name);
    }
  }, [color, product.colors, onColorChange]);

  const [quantity, setQuantity] = React.useState(1);

  React.useEffect(() => {
    setQuantity((q) => Math.min(Math.max(1, q), Math.max(1, availableStock || 1)));
  }, [availableStock, color]);

  const addItem = useCartStore((state) => state.addItem);
  const showToast = useToastStore((state) => state.showToast);
  const router = useRouter();

  function scrollToReviews() {
    document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const [isAdding, setIsAdding] = React.useState(false);
  const [isBuying, setIsBuying] = React.useState(false);

  function buildCartItem() {
    const promoDiscountPerUnit = activePromo
      ? activePromo.discountType === "percentage"
        ? product.price * (activePromo.discountValue / 100)
        : activePromo.discountValue
      : 0;
    return {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: activeImage || product.images[0] || "",
      selectedColor: color,
      selectedLength: selectedLength || product.availableLengths[0] || "",
      quantity,
      unitPrice: product.price - promoDiscountPerUnit,
      promotionId: activePromo?.id,
      promotionName: activePromo?.name,
      promoDiscountPerUnit: activePromo ? promoDiscountPerUnit : undefined
    };
  }

  function handleAddToCart() {
    setIsAdding(true);
    addItem(buildCartItem());
    showToast(`${product.name} added to cart`);
    window.setTimeout(() => setIsAdding(false), 600);
  }

  function handleBuyNow() {
    setIsBuying(true);
    addItem(buildCartItem());
    router.push("/checkout");
  }

  const isLowStock =
    availableStock > 0 &&
    (availableStock <= product.lowStockThreshold);

  const stockLabel =
    availableStock === 0
      ? "Out of stock"
      : isLowStock
        ? `Only ${availableStock} meters left`
        : "In Stock";
  const stockColorClass =
    availableStock === 0 ? "text-red-500" : isLowStock ? "text-rust-dark" : "text-forest";
  const stockDotClass =
    availableStock === 0 ? "bg-red-500" : isLowStock ? "bg-rust-dark" : "bg-forest";

  const sku = product.sku?.trim() || undefined;

  const computedDiscount = React.useMemo(() => {
    if (activePromo) {
      const amount =
        activePromo.discountType === "percentage"
          ? product.price * (activePromo.discountValue / 100)
          : activePromo.discountValue;
      return { amount, formatted: formatPrice(amount) };
    }
    if (product.originalPrice && product.originalPrice > product.price) {
      const amount = product.originalPrice - product.price;
      return { amount, formatted: formatPrice(amount) };
    }
    return null;
  }, [activePromo, product.price, product.originalPrice]);

  const breadcrumb = [
    product.category,
    product.fabricType && product.fabricType !== product.category ? product.fabricType : null
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <div>
      {breadcrumb && (
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-charcoal/45">
          {breadcrumb}
        </p>
      )}

      <h1 className="mt-3 font-serif text-display-md font-medium leading-[1.15] text-charcoal sm:text-display-lg">
        {product.name}
      </h1>

      {product.reviewCount > 0 && (
        <button
          type="button"
          onClick={scrollToReviews}
          className="mt-3 inline-flex items-center transition-opacity hover:opacity-70"
          aria-label="Jump to reviews"
        >
          <RatingStars
            rating={product.rating}
            reviewCount={product.reviewCount}
            size={15}
          />
        </button>
      )}

      <div className="mt-6 border-t border-charcoal/[0.06] pt-6">
        {activePromo ? (
          <>
            <div className="mb-3">
              <Badge variant="rust" className="rounded-full text-[10px] tracking-wide">
                <Timer className="mr-1 h-3 w-3" />
                LIMITED-TIME OFFER
              </Badge>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-medium tracking-tight text-rust-dark">
                {formatPrice(
                  product.price -
                    (activePromo.discountType === "percentage"
                      ? product.price * (activePromo.discountValue / 100)
                      : activePromo.discountValue)
                )}
              </span>
              <span className="text-base text-charcoal/30 line-through">
                {formatPrice(product.price)}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-[12px] font-medium text-forest">
                You save{" "}
                {formatPrice(
                  activePromo.discountType === "percentage"
                    ? product.price * (activePromo.discountValue / 100)
                    : activePromo.discountValue
                )}
              </span>
            </div>
            <div className="mt-4">
              <CountdownTimer
                targetDate={activePromo.expiresAt}
                label="OFFER ENDS IN"
                expiredLabel="OFFER ENDED"
                size="sm"
              />
            </div>
          </>
        ) : (
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-medium tracking-tight text-charcoal">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <span className="text-base text-charcoal/30 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
                <span className="text-[12px] font-medium text-forest">
                  Save {computedDiscount?.formatted}
                </span>
              </>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
          {sku && <span className="text-charcoal/45">SKU: {sku}</span>}
          {sku && <span className="text-charcoal/25">•</span>}
          <span className={cn("flex items-center gap-1.5 font-medium", stockColorClass)}>
            <span className={cn("inline-block h-1.5 w-1.5 rounded-full", stockDotClass)} />
            {stockLabel}
          </span>
        </div>
      </div>

      {product.colors.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-overline uppercase text-charcoal/40">
            Color
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-4">
            {product.colors.map((option) => {
              const isSelected = color === option.name;
              const soldOut = (option.stock ?? 0) <= 0;
              const colorImage =
                option.image || (option.images && option.images[0]);
              return (
                <button
                  key={option.name}
                  type="button"
                  onClick={() => handleColorChange(option.name)}
                  disabled={soldOut}
                  aria-label={soldOut ? `${option.name} sold out` : option.name}
                  aria-pressed={isSelected}
                  aria-disabled={soldOut}
                  className={cn(
                    "flex w-16 flex-col items-center gap-2",
                    soldOut && "cursor-not-allowed"
                  )}
                >
                  <span
                    className={cn(
                      "relative block h-14 w-14 overflow-hidden rounded-full border-2 transition-all duration-200",
                      soldOut && "opacity-50",
                      isSelected
                        ? "border-forest ring-2 ring-forest/20 ring-offset-2 ring-offset-cream"
                        : "border-charcoal/15 hover:border-charcoal/35",
                      soldOut && !isSelected && "border-charcoal/10"
                    )}
                  >
                    {colorImage ? (
                      <Image
                        src={colorImage}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <span
                        className={cn(
                          "absolute inset-0",
                          LIGHT_SWATCH_HEXES.includes(option.hex) &&
                            "border border-charcoal/10"
                        )}
                        style={{ backgroundColor: option.hex }}
                      />
                    )}
                    {soldOut && (
                      <span className="absolute inset-0 flex items-center justify-center bg-cream/55">
                        <span className="rounded bg-charcoal/80 px-1 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-cream">
                          Sold Out
                        </span>
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-center text-[11px] font-medium leading-tight",
                      soldOut ? "text-charcoal/35" : isSelected ? "text-charcoal" : "text-charcoal/55"
                    )}
                  >
                    {option.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {product.description?.trim() && (
        <p className="mt-6 whitespace-pre-line text-[14px] leading-relaxed text-charcoal/60">
          {product.description.trim()}
        </p>
      )}

      <FabricDetails product={product} selectedLength={selectedLength} />

      <div className="mt-8">
        <p className="mb-3 text-overline uppercase text-charcoal/40">
          Quantity
        </p>
        <div className="flex items-center rounded-lg border border-charcoal/12">
          <button
            type="button"
            onClick={() => setQuantity((v) => Math.max(1, v - 1))}
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            className="flex h-10 w-10 items-center justify-center text-charcoal/50 transition-colors hover:bg-charcoal/[0.04] hover:text-charcoal disabled:pointer-events-none disabled:opacity-25"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-10 text-center text-sm font-medium tabular-nums text-charcoal">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() =>
              setQuantity((v) => Math.min(availableStock, v + 1))
            }
            aria-label="Increase quantity"
            disabled={availableStock === 0 || quantity >= availableStock}
            className="flex h-10 w-10 items-center justify-center text-charcoal/50 transition-colors hover:bg-charcoal/[0.04] hover:text-charcoal disabled:pointer-events-none disabled:opacity-25"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Button
          onClick={handleAddToCart}
          size="lg"
          disabled={availableStock === 0 || isAdding}
          className="h-14 w-full rounded-full text-[15px] font-semibold tracking-wide"
        >
          {isAdding ? (
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Added to Cart
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Add to Cart
            </span>
          )}
        </Button>
        <Button
          onClick={handleBuyNow}
          variant="outline"
          size="lg"
          disabled={availableStock === 0 || isBuying}
          className="h-12 w-full rounded-full text-[14px] font-medium"
        >
          <Zap className="h-4 w-4" />
          {isBuying ? "Redirecting..." : "Buy Now"}
        </Button>
      </div>

      <MobileStickyBar
        product={product}
        availableStock={availableStock}
        price={product.price}
        originalPrice={product.originalPrice}
        activePromo={activePromo}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        isAdding={isAdding}
      />
    </div>
  );
}

function MobileStickyBar({
  product,
  availableStock,
  price,
  activePromo,
  onAddToCart,
  onBuyNow,
  isAdding
}: {
  product: Product;
  availableStock: number;
  price: number;
  originalPrice?: number;
  activePromo: ApiPromotionWithStatus | null;
  onAddToCart: () => void;
  onBuyNow: () => void;
  isAdding: boolean;
}) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 600);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const displayPrice = React.useMemo(() => {
    if (activePromo) {
      return (
        price -
        (activePromo.discountType === "percentage"
          ? price * (activePromo.discountValue / 100)
          : activePromo.discountValue)
      );
    }
    return price;
  }, [price, activePromo]);

  if (availableStock === 0) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-charcoal/[0.08] bg-white/95 px-4 py-3 backdrop-blur-md transition-all duration-300 lg:hidden",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0 pointer-events-none"
      )}
    >
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-charcoal">
            {product.name}
          </p>
          <p className="text-lg font-medium tracking-tight text-charcoal">
            {formatPrice(displayPrice)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onAddToCart}
            size="sm"
            disabled={isAdding}
            className="h-10 rounded-full px-5 text-[13px]"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {isAdding ? "Added" : "Add"}
          </Button>
          <Button
            onClick={onBuyNow}
            variant="outline"
            size="sm"
            disabled={isAdding}
            className="h-10 rounded-full px-5 text-[13px]"
          >
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  );
}
