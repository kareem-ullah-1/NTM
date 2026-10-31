"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Bell, Check, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  fetchPublicDrops,
  subscribeToDropNotification,
} from "@/lib/api/product-drops";
import { queryKeys } from "@/lib/api/query-keys";
import { CountdownTimer } from "@/components/shared/CountdownTimer";
import { FadeUp } from "@/components/motion/reveal";
import { formatPrice, cn } from "@/lib/utils";
import { useToastStore } from "@/store/use-toast-store";
import { ApiRequestError } from "@/lib/api/client";
import type { ApiProductDrop } from "@/lib/api/product-drops";

export function DropSection() {
  const { data: drops, isLoading } = useQuery({
    queryKey: queryKeys.productDrops.public,
    queryFn: fetchPublicDrops,
  });

  if (isLoading || !drops) return null;

  const allDrops = [...drops.upcoming, ...drops.live];
  if (allDrops.length === 0) return null;

  const featuredDrop = drops.live[0] ?? drops.upcoming[0];

  return (
    <section className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 lg:px-12">
      <FadeUp>
        <DropCard drop={featuredDrop} />
      </FadeUp>
    </section>
  );
}

function DropCard({ drop }: { drop: ApiProductDrop }) {
  const isUpcoming = drop.status === "upcoming";
  const isLive = drop.status === "live";
  const isSoldOut = drop.status === "sold_out" || drop.soldQuantity >= drop.maxQuantity;
  const isEnded = drop.status === "ended";

  const remaining = drop.maxQuantity - drop.soldQuantity;
  const soldPercent =
    drop.maxQuantity > 0
      ? Math.round((drop.soldQuantity / drop.maxQuantity) * 100)
      : 0;

  return (
    <div className="relative overflow-hidden rounded-[12px] border border-charcoal/[0.06] bg-charcoal p-8 sm:p-12 lg:p-16">
      {/* Decorative elements */}
      <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-cream/[0.02] blur-3xl" />

      <div className="relative flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">
        {/* Product image */}
        {drop.product?.images?.[0] && (
          <div className="relative aspect-[3/4] w-full max-w-[340px] shrink-0 overflow-hidden rounded-[10px] lg:mx-0 mx-auto">
            <Image
              src={drop.product.images[0]}
              alt={drop.name}
              fill
              sizes="(min-width: 1024px) 340px, 90vw"
              className="object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 text-center lg:text-left">
          <span className="mb-4 inline-flex items-center gap-2 text-overline uppercase text-sand">
            <span className="h-px w-6 bg-sand/40" aria-hidden="true" />
            {isUpcoming
              ? "Coming Soon"
              : isLive
                ? "Available Now"
                : isSoldOut
                  ? "Sold Out"
                  : isEnded
                    ? "Drop Ended"
                    : "Drop"}
          </span>

          <h2 className="font-serif text-display-md text-cream sm:text-display-lg lg:text-display-xl">
            {drop.name}
          </h2>

          {drop.product && (
            <p className="mt-1 text-[13px] text-cream/40">
              {drop.product.name}
            </p>
          )}

          <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-cream/55">
            {drop.description ||
              "A limited release crafted for timeless Pakistani formalwear."}
          </p>

          {/* Pricing */}
          <div className="mt-6 flex flex-col items-center gap-2 lg:items-start">
            {drop.specialPrice && (
              <div className="flex items-center gap-3">
                <span className="font-serif text-2xl font-medium text-cream">
                  {formatPrice(drop.specialPrice)}
                </span>
                {drop.product && (
                  <span className="text-base text-cream/35 line-through">
                    {formatPrice(drop.product.price)}
                  </span>
                )}
              </div>
            )}
            {!drop.specialPrice && drop.product && (
              <span className="font-serif text-2xl font-medium text-cream">
                {formatPrice(drop.product.price)}
              </span>
            )}

            {/* Stock display */}
            {remaining > 0 && isLive && (
              <div className="flex flex-col items-center gap-1.5 lg:items-start">
                <p className="text-[12px] text-cream/40">
                  {remaining} of {drop.maxQuantity} pieces remaining
                </p>
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-cream/10">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      soldPercent >= 80 ? "bg-rust" : "bg-forest"
                    )}
                    style={{ width: `${soldPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action area */}
          <div className="mt-8">
            {isUpcoming && (
              <UpcomingActions drop={drop} />
            )}

            {isLive && !isSoldOut && (
              <Link
                href={`/shop/${drop.product?.slug ?? ""}`}
                className="inline-flex items-center gap-2 rounded-full bg-cream px-6 py-3 text-[13px] font-medium text-charcoal transition-colors hover:bg-cream-dark"
              >
                Buy Now
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}

            {isSoldOut && (
              <div className="flex flex-col items-center gap-3 lg:items-start">
                <span className="inline-flex items-center rounded-full border border-cream/15 px-6 py-3 text-[13px] font-medium text-cream/60">
                  Sold Out
                </span>
                <NotifyButton dropId={drop.id} />
              </div>
            )}

            {isEnded && (
              <span className="inline-flex items-center rounded-full border border-cream/15 px-6 py-3 text-[13px] font-medium text-cream/60">
                Drop Ended
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function UpcomingActions({ drop }: { drop: ApiProductDrop }) {
  return (
    <div className="flex flex-col items-center gap-4 lg:items-start">
      <CountdownTimer
        targetDate={drop.startsAt}
        label="Available In"
        expiredLabel="Available Now"
        size="md"
        onComplete={() => {
        }}
      />
      <NotifyButton dropId={drop.id} />
    </div>
  );
}

function NotifyButton({ dropId }: { dropId: string }) {
  const [email, setEmail] = React.useState("");
  const [subscribed, setSubscribed] = React.useState(false);
  const [showInput, setShowInput] = React.useState(false);
  const showToast = useToastStore((s) => s.showToast);

  const mutation = useMutation({
    mutationFn: (inputEmail: string) =>
      subscribeToDropNotification(dropId, inputEmail),
    onSuccess: (result) => {
      setSubscribed(true);
      showToast(result.message);
    },
    onError: (error) => {
      showToast(
        error instanceof ApiRequestError
          ? error.message
          : "Failed to subscribe. Please try again.", "error"
      );
    },
  });

  if (subscribed) {
    return (
      <span className="inline-flex items-center gap-2 text-[13px] text-cream/60">
        <Check className="h-4 w-4" />
        You&apos;ll be notified
      </span>
    );
  }

  if (showInput) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim()) {
            mutation.mutate(email.trim());
          }
        }}
        className="flex flex-col items-center gap-2 lg:items-start"
      >
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            className="rounded-full border border-cream/20 bg-cream/5 px-4 py-2.5 text-[13px] text-cream placeholder:text-cream/30 focus:outline-none focus:ring-1 focus:ring-cream/30"
            required
          />
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center gap-2 rounded-full border border-cream/20 px-5 py-2.5 text-[13px] font-medium text-cream transition-colors hover:bg-cream/10"
          >
            {mutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Bell className="h-4 w-4" />
                Notify Me
              </>
            )}
          </button>
        </div>
      </form>
    );
  }

  return (
    <button
      onClick={() => setShowInput(true)}
      className="inline-flex items-center gap-2 rounded-full border border-cream/20 px-6 py-3 text-[13px] font-medium text-cream transition-colors hover:bg-cream/10"
    >
      <Bell className="h-4 w-4" />
      Get Notified
    </button>
  );
}
