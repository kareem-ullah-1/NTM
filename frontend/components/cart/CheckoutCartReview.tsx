"use client";

import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/use-cart-store";
import { formatPrice } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";

export function CheckoutCartReview() {
  const items = useCartStore((state) => state.items);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="rounded-card border border-charcoal/[0.08] bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-forest/10">
            <ShoppingBag className="h-3.5 w-3.5 text-forest" />
          </div>
          <div>
            <p className="text-[15px] font-medium text-charcoal">Review Your Order</p>
            <p className="text-[12px] text-charcoal/45">
              {totalQuantity} {totalQuantity === 1 ? "item" : "items"}
            </p>
          </div>
        </div>
        <Link
          href="/cart"
          className="text-[12px] font-medium text-forest hover:underline"
        >
          Edit cart
        </Link>
      </div>

      <div className="mt-3 max-h-[220px] space-y-0 overflow-y-auto overscroll-contain divide-y divide-charcoal/[0.06] sm:max-h-[280px]">
        {items.map((item) => (
          <div key={item.cartItemId} className="flex gap-3 py-2.5 first:pt-0 last:pb-0">
            <Link
              href={`/shop/${item.slug}`}
              className="relative h-14 w-11 shrink-0 overflow-hidden rounded-md bg-charcoal/[0.03]"
            >
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="44px"
                className="object-cover"
              />
            </Link>

            <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  href={`/shop/${item.slug}`}
                  className="line-clamp-1 text-[13px] font-medium text-charcoal transition-colors hover:text-forest"
                >
                  {item.name}
                </Link>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-charcoal/50">
                  {item.selectedColor && (
                    <span className="flex items-center gap-1">
                      <span
                        className="inline-block h-2 w-2 rounded-full border border-charcoal/10"
                        style={{
                          backgroundColor: item.selectedColor.startsWith("#")
                            ? item.selectedColor
                            : undefined
                        }}
                      />
                      {item.selectedColor}
                    </span>
                  )}
                  {item.selectedColor && item.selectedLength && (
                    <span className="text-charcoal/25">·</span>
                  )}
                  {item.selectedLength && <span>{item.selectedLength}</span>}
                  <span className="text-charcoal/25">·</span>
                  <span>×{item.quantity}</span>
                </div>
              </div>
              <span className="shrink-0 text-[12px] font-medium text-charcoal">
                {formatPrice(item.unitPrice * item.quantity)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
