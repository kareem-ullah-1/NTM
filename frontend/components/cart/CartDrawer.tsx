"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { drawerTransition, overlayTransition, motionDuration } from "@/lib/motion";
import { Minus, Plus, Trash2, ShoppingBag, X } from "lucide-react";
import { useCartStore } from "@/store/use-cart-store";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function CartDrawer() {
  const isCartDrawerOpen = useCartStore((state) => state.isCartDrawerOpen);
  const closeCartDrawer = useCartStore((state) => state.closeCartDrawer);
  const items = useCartStore((state) => state.items);
  const totalItems = useCartStore((state) => state.totalItems());
  const subtotal = useCartStore((state) => state.subtotal());
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const reduced = useReducedMotion();

  React.useEffect(() => {
    if (!isCartDrawerOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCartDrawer();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isCartDrawerOpen, closeCartDrawer]);

  return (
    <AnimatePresence>
      {isCartDrawerOpen && (
        <>
          {}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduced ? { duration: 0 } : overlayTransition}
            className="fixed inset-0 z-[90] bg-charcoal/40 backdrop-blur-sm"
            onClick={closeCartDrawer}
            aria-hidden="true"
          />

          {}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={
              reduced
                ? { duration: 0 }
                : drawerTransition
            }
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            className="fixed inset-y-0 right-0 z-[100] flex w-full max-w-[420px] flex-col bg-white shadow-[-8px_0_30px_rgba(0,0,0,0.12)]"
          >
            {}
            <div className="flex items-center justify-between border-b border-charcoal/[0.06] px-6 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-charcoal" />
                <h2 className="font-serif text-lg text-charcoal">Your Cart</h2>
                {totalItems > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-forest px-1.5 text-[10px] font-medium text-cream">
                    {totalItems}
                  </span>
                )}
              </div>
              <button
                onClick={closeCartDrawer}
                aria-label="Close cart"
                className="flex h-8 w-8 items-center justify-center rounded-full text-charcoal/50 transition-colors hover:bg-charcoal/5 hover:text-charcoal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-charcoal/5">
                    <ShoppingBag className="h-7 w-7 text-charcoal/25" />
                  </div>
                  <p className="mt-4 font-serif text-lg text-charcoal">Your cart is empty</p>
                  <p className="mt-1 text-[13px] text-charcoal/50">
                    Browse the collection and add fabrics you love.
                  </p>
                  <Button
                    asChild
                    className="mt-6 rounded-full px-6"
                    onClick={closeCartDrawer}
                  >
                    <Link href="/shop">Continue Shopping</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-0">
                  <AnimatePresence initial={false} mode="popLayout">
                  {items.map((item) => (
                    <motion.div
                      key={item.cartItemId}
                      layout={!reduced}
                      initial={reduced ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduced ? undefined : { opacity: 0, y: -6 }}
                      transition={{ duration: reduced ? 0 : motionDuration.fast, ease: [0.16, 1, 0.3, 1] }}
                      className="flex gap-4 border-b border-charcoal/[0.04] py-4"
                    >
                      {}
                      <Link
                        href={`/shop/${item.slug}`}
                        onClick={closeCartDrawer}
                        className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-charcoal/[0.03]"
                      >
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </Link>

                      {}
                      <div className="flex flex-1 flex-col justify-between min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link
                              href={`/shop/${item.slug}`}
                              onClick={closeCartDrawer}
                              className="block font-serif text-[13px] font-medium text-charcoal transition-colors hover:text-forest truncate"
                            >
                              {item.name}
                            </Link>
                            <p className="mt-0.5 text-[11px] text-charcoal/45">
                              {item.selectedColor} &middot; {item.selectedLength}
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(item.cartItemId)}
                            aria-label={`Remove ${item.name}`}
                            className="shrink-0 text-charcoal/30 transition-colors hover:text-rust"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          {}
                          <div className="flex items-center gap-0.5 rounded-full border border-charcoal/[0.12] px-1 py-0.5">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              aria-label="Decrease quantity"
                              className="flex h-8 w-8 items-center justify-center rounded-full text-charcoal/50 transition-colors hover:bg-charcoal/[0.04] hover:text-forest disabled:pointer-events-none disabled:opacity-30"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="min-w-[1.25rem] text-center text-[12px] font-medium tabular-nums text-charcoal">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                              aria-label="Increase quantity"
                              className="flex h-8 w-8 items-center justify-center rounded-full text-charcoal/50 transition-colors hover:bg-charcoal/[0.04] hover:text-forest"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="text-[13px] font-medium text-charcoal">
                            {formatPrice(item.unitPrice * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {}
            {items.length > 0 && (
              <div className="border-t border-charcoal/[0.06] px-6 py-5">
                {}
                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-charcoal/60">Subtotal</span>
                  <span className="font-medium text-charcoal">{formatPrice(subtotal)}</span>
                </div>
                <p className="mt-1 text-[11px] text-charcoal/40">
                  Delivery calculated at checkout
                </p>

                {}
                <Button
                  asChild
                  className="mt-4 w-full rounded-full"
                  size="lg"
                  onClick={closeCartDrawer}
                >
                  <Link href="/checkout">Checkout</Link>
                </Button>

                {}
                <button
                  type="button"
                  onClick={closeCartDrawer}
                  className="mt-3 w-full rounded-lg py-2 text-center text-[12px] font-medium text-charcoal/50 transition-colors hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
