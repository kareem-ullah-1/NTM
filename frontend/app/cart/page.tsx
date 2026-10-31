"use client";

import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/use-cart-store";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

function CartContent() {
  const items = useCartStore((state) => state.items);

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 lg:px-12">
      <h1 className="font-serif text-display-lg text-charcoal sm:text-display-xl">
        Your Cart
      </h1>

      {items.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={ShoppingBag}
            title="Your fabric selection is waiting"
            description="Browse the collection and add a few lengths you love."
            action={
              <Button asChild className="mt-3 rounded-full">
                <Link href="/shop">Continue Shopping</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
          <div>
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <CartItemRow key={item.cartItemId} item={item} />
              ))}
            </AnimatePresence>
            <Button
              asChild
              variant="outline"
              className="mt-8 rounded-full"
            >
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
          <OrderSummary />
        </div>
      )}
    </div>
  );
}

export default function CartPage() {
  return <CartContent />;
}
