"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { newsletterSchema, type NewsletterValues } from "@/lib/validations";
import { useToastStore } from "@/store/use-toast-store";
import { subscribeToNewsletter } from "@/lib/api/contact";
import { ApiRequestError } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Newsletter() {
  const showToast = useToastStore((state) => state.showToast);
  const [justSubscribed, setJustSubscribed] = React.useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<NewsletterValues>({ resolver: zodResolver(newsletterSchema) });

  const subscribeMutation = useMutation({
    mutationFn: (values: NewsletterValues) => subscribeToNewsletter(values.email),
    onSuccess: (result) => {
      showToast(
        result.alreadySubscribed
          ? "You're already subscribed."
          : "You're subscribed. Welcome to NTM Fabrics."
      );
      setJustSubscribed(true);
      reset();
      window.setTimeout(() => setJustSubscribed(false), 4000);
    },
    onError: (error) => {
      showToast(
        error instanceof ApiRequestError
          ? error.message
          : "Failed to subscribe. Please try again.",
        "error"
      );
    }
  });

  function onSubmit(values: NewsletterValues) {
    subscribeMutation.mutate(values);
  }

  return (
    <section className="relative overflow-hidden border-t border-charcoal/[0.06] bg-cream">
      {/* Subtle woven texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(26,26,24,0.4) 3px, rgba(26,26,24,0.4) 4px), repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(26,26,24,0.25) 3px, rgba(26,26,24,0.25) 4px)"
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-lg text-center"
        >
          {/* Eyebrow */}
          <span className="mb-5 inline-block text-overline uppercase tracking-[0.18em] text-charcoal/35">
            NTM Fabrics
          </span>

          {/* Heading */}
          <h2 className="font-serif text-display-md font-medium tracking-tight text-charcoal sm:text-display-lg">
            Stay Close to What&apos;s New
          </h2>

          {/* Description */}
          <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-charcoal/50">
            Get first access to new arrivals, seasonal collections,
            exclusive offers, and fabric worth knowing about.
          </p>

          {/* Perks — compact inline */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-[12px] text-charcoal/40">
            <span>New arrivals</span>
            <span aria-hidden="true" className="text-charcoal/20">
              ·
            </span>
            <span>Collection previews</span>
            <span aria-hidden="true" className="text-charcoal/20">
              ·
            </span>
            <span>Exclusive offers</span>
          </div>

          {/* Form / Success */}
          <div className="mt-8 min-h-[120px]">
            <AnimatePresence mode="wait">
              {justSubscribed ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center gap-3 py-6"
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: 0.1,
                      type: "spring",
                      stiffness: 300,
                      damping: 18
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-forest/10"
                  >
                    <Check
                      className="h-5 w-5 text-forest"
                      strokeWidth={2.5}
                    />
                  </motion.span>
                  <div className="text-center">
                    <p className="text-[14px] font-medium text-charcoal">
                      You&apos;re on the list.
                    </p>
                    <p className="mt-1 text-[13px] text-charcoal/45">
                      You&apos;ll hear from NTM Fabrics when something worth
                      seeing arrives.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleSubmit(onSubmit)}
                  className="flex flex-col gap-3 sm:flex-row sm:items-start"
                  noValidate
                >
                  <div className="flex-1 text-left">
                    <label htmlFor="newsletter-email" className="sr-only">
                      Email address
                    </label>
                    <Input
                      id="newsletter-email"
                      type="email"
                      placeholder="Email address"
                      className={cn(
                        "h-12 rounded-lg border-charcoal/12 bg-white px-4 text-[14px] text-charcoal placeholder:text-charcoal/30 focus-visible:ring-forest/30",
                        errors.email && "border-red-300 focus-visible:ring-red-300/30"
                      )}
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="mt-1.5 text-xs text-red-400">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <motion.div whileTap={{ scale: 0.97 }} className="shrink-0">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={subscribeMutation.isPending}
                      className={cn(
                        "h-12 w-full rounded-lg px-8 text-[13px] font-semibold uppercase tracking-[0.08em] sm:w-auto",
                        subscribeMutation.isPending && "opacity-80"
                      )}
                    >
                      {subscribeMutation.isPending
                        ? "Subscribing..."
                        : "Subscribe"}
                    </Button>
                  </motion.div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Disclaimer */}
          <p className="text-[11px] leading-relaxed text-charcoal/30">
            No spam. Unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
