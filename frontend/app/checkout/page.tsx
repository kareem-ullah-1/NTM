import { CheckoutForm } from "@/components/forms/CheckoutForm";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { CheckoutCartReview } from "@/components/cart/CheckoutCartReview";
import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Checkout",
  keywords: [
    "checkout",
    "cash on delivery Pakistan",
    "place fabric order",
    "secure checkout",
    "order unstitched fabric",
    "fabric order Pakistan"
  ],
  robots: { index: false, follow: false }
};

export default function CheckoutPage() {
  return (
    <div className="bg-cream">
      <div className="mx-auto max-w-[1200px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-4 sm:mb-5">
          <h1 className="font-serif text-[1.75rem] leading-tight text-charcoal sm:text-display-md">
            Checkout
          </h1>
          <p className="mt-1 text-[13px] text-charcoal/55">
            Enter your details and place your order.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-8">
          <div className="order-2 min-w-0 space-y-3 lg:order-1 lg:space-y-4">
            <CheckoutCartReview />
            <CheckoutForm />
          </div>

          <aside className="order-1 lg:order-2">
            <div className="lg:sticky lg:top-24">
              <OrderSummary showCheckoutButton={false} compact />
              <div className="mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-charcoal/[0.06] bg-white px-3 py-2">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-forest" />
                <span className="text-[11px] text-charcoal/50">
                  Secure checkout · Cash on Delivery
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
