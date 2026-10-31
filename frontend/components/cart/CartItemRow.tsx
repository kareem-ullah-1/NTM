"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem } from "@/types/cart";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/use-cart-store";

export function CartItemRow({
  item,
  readOnly = false
}: {
  item: CartItem;
  readOnly?: boolean;
}) {
  const reduced = useReducedMotion();
  const { updateQuantity, removeItem } = useCartStore();
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  return (
    <motion.div
      layout={!reduced}
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -6 }}
      transition={{ duration: reduced ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="flex gap-5 border-b border-charcoal/[0.06] py-6"
    >
      <Link
        href={`/shop/${item.slug}`}
        className="relative h-24 w-20 shrink-0 overflow-hidden rounded-[8px] bg-charcoal/[0.03]"
      >
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="80px"
          className="object-cover"
        />
      </Link>
      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              href={`/shop/${item.slug}`}
              className="font-serif text-[15px] font-medium text-charcoal transition-colors hover:text-forest"
            >
              {item.name}
            </Link>
            <p className="mt-1 text-[12px] text-charcoal/45">
              {item.selectedColor} &middot; {item.selectedLength}
            </p>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-2">
              {confirmDelete ? (
                <>
                  <button
                    onClick={() => {
                      removeItem(item.cartItemId);
                      setConfirmDelete(false);
                    }}
                    className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-medium text-red-600 hover:bg-red-100"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-full px-3 py-1 text-[11px] font-medium text-charcoal/45 hover:bg-charcoal/5"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  aria-label={`Remove ${item.name} from cart`}
                  className="text-charcoal/35 transition-colors hover:text-rust"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          {readOnly ? (
            <span className="text-[13px] text-charcoal/55">
              Qty {item.quantity}
            </span>
          ) : (
            <div className="flex items-center gap-3 rounded-full border border-charcoal/[0.12] px-3.5 py-1">
              <button
                onClick={() =>
                  updateQuantity(item.cartItemId, item.quantity - 1)
                }
                aria-label="Decrease quantity"
                className="text-charcoal/50 transition-colors hover:text-forest"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-4 text-center text-[13px] font-medium">
                {item.quantity}
              </span>
              <button
                onClick={() =>
                  updateQuantity(item.cartItemId, item.quantity + 1)
                }
                aria-label="Increase quantity"
                className="text-charcoal/50 transition-colors hover:text-forest"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <span className="text-[13px] font-medium text-charcoal">
            {formatPrice(item.unitPrice * item.quantity)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
