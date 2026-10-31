"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Tag, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/use-cart-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToastStore } from "@/store/use-toast-store";
import { validateCoupon } from "@/lib/api/coupons";
import { ApiRequestError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export function OrderSummary({
  showCheckoutButton = true,
  compact = false
}: {
  showCheckoutButton?: boolean;
  compact?: boolean;
}) {
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => {
    setHydrated(true);
  }, []);

  const subtotal = useCartStore((state) => state.subtotal());
  const appliedCoupon = useCartStore((state) => state.appliedCoupon);
  const setAppliedCoupon = useCartStore((state) => state.setAppliedCoupon);
  const [promoCode, setPromoCode] = React.useState("");
  const [promoError, setPromoError] = React.useState<string | null>(null);
  const [isApplying, setIsApplying] = React.useState(false);
  const showToast = useToastStore((state) => state.showToast);

  const promoDiscount = useCartStore(
    (state) => state.appliedPromo?.discountAmount ?? 0
  );
  const appliedPromo = useCartStore((state) => state.appliedPromo);
  const discount = appliedCoupon?.discountAmount ?? 0;

  const total = Math.max(0, subtotal - discount);

  async function applyPromo() {
    if (!promoCode.trim()) return;
    setIsApplying(true);
    setPromoError(null);
    try {
      const result = await validateCoupon(promoCode.trim(), subtotal);
      setAppliedCoupon({
        code: result.code,
        discountAmount: result.discountAmount,
        discountType: result.discountType
      });
      showToast(`Coupon applied — ${formatPrice(result.discountAmount)} off`);
    } catch (error) {
      setAppliedCoupon(null);
      setPromoError(
        error instanceof ApiRequestError
          ? error.message
          : "That coupon isn't valid."
      );
    } finally {
      setIsApplying(false);
    }
  }

  function removePromo() {
    setAppliedCoupon(null);
    setPromoCode("");
    setPromoError(null);
  }

  if (!hydrated) {
    return (
      <div
        className={cn(
          "rounded-card border border-charcoal/[0.08] bg-white",
          compact ? "p-4" : "p-6"
        )}
      >
        <p className="font-serif text-[16px] font-medium text-charcoal">Order Summary</p>
        <div className="mt-3 space-y-2 text-[13px]">
          <div className="flex justify-between text-charcoal/60">
            <span>Subtotal</span>
            <span>{formatPrice(0)}</span>
          </div>
        </div>
        <Separator className="my-3" />
        <div className="flex justify-between text-base font-medium text-charcoal">
          <span>Total</span>
          <span>{formatPrice(0)}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-card border border-charcoal/[0.08] bg-white",
        compact ? "p-4 sm:p-5" : "p-6"
      )}
    >
      <p className="font-serif text-[16px] font-medium text-charcoal">Order Summary</p>

      <div className={cn("space-y-2 text-[13px]", compact ? "mt-3" : "mt-5")}>
        <div className="flex justify-between text-charcoal/60">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {appliedPromo && (
          <div className="flex justify-between text-forest">
            <span className="truncate pr-2">{appliedPromo.name}</span>
            <span className="shrink-0">-{formatPrice(promoDiscount)}</span>
          </div>
        )}
        {appliedCoupon && (
          <div className="flex justify-between text-forest">
            <span>Coupon ({appliedCoupon.code})</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}
      </div>

      <Separator className={compact ? "my-3" : "my-4"} />

      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-charcoal">Total</span>
        <span className="text-lg font-semibold text-charcoal sm:text-xl">
          {formatPrice(total)}
        </span>
      </div>

      {/* Coupon */}
      <div className={compact ? "mt-4" : "mt-6"}>
        <div className="mb-2 flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-charcoal/35" />
          <span className="text-[11px] font-medium uppercase tracking-wide text-charcoal/40">
            Coupon code
          </span>
        </div>

        {appliedCoupon ? (
          <div className="flex items-center justify-between rounded-lg border border-forest/20 bg-forest/[0.04] px-3 py-2">
            <div className="flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-forest" />
              <span className="text-[13px] font-medium text-forest">
                {appliedCoupon.code}
              </span>
            </div>
            <button
              type="button"
              onClick={removePromo}
              className="flex h-7 w-7 items-center justify-center rounded-full text-charcoal/40 transition-colors hover:bg-red-50 hover:text-red-500"
              aria-label="Remove coupon"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={promoCode}
              onChange={(event) => {
                setPromoCode(event.target.value);
                setPromoError(null);
              }}
              placeholder="Enter code"
              className="h-10 text-[13px]"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyPromo();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={applyPromo}
              disabled={isApplying || !promoCode.trim()}
              className="h-10 shrink-0 rounded-lg px-4"
            >
              {isApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
            </Button>
          </div>
        )}
        {promoError && (
          <p className="mt-1.5 text-[12px] text-red-500">{promoError}</p>
        )}
      </div>

      {showCheckoutButton && (
        <Button
          asChild
          size="lg"
          className="mt-5 h-11 w-full rounded-lg text-[14px]"
        >
          <Link href="/checkout">
            Proceed to Checkout
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}
