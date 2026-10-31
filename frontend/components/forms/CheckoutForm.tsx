"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Loader2,
  MapPin,
  Phone,
  User,
  Mail,
  CreditCard,
  Truck
} from "lucide-react";
import { checkoutFormSchema, type CheckoutFormValues } from "@/lib/validations";
import { useCartStore } from "@/store/use-cart-store";
import { formatPrice, cn } from "@/lib/utils";
import { placeOrder } from "@/lib/api/orders";
import { trackEvent } from "@/lib/analytics";
import { siteConfig } from "@/lib/site-config";
import { ApiRequestError } from "@/lib/api/client";
import { fetchAvailableCities } from "@/lib/api/cities";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const fieldInputClass = "h-10 pl-9 text-[13px]";
const selectClass =
  "flex h-10 w-full rounded-lg border border-charcoal/15 bg-white px-3 text-[13px] text-charcoal placeholder:text-charcoal/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest disabled:cursor-not-allowed disabled:opacity-50";

export function CheckoutForm() {
  const { items, clearCart } = useCartStore();
  const appliedCoupon = useCartStore((state) => state.appliedCoupon);
  const setAppliedCoupon = useCartStore((state) => state.setAppliedCoupon);
  const setCheckoutCity = useCartStore((state) => state.setCheckoutCity);
  const [orderNumber, setOrderNumber] = React.useState<string | null>(null);
  const [submittedName, setSubmittedName] = React.useState("");
  const [submittedPhone, setSubmittedPhone] = React.useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: { paymentMethod: "Cash on Delivery" }
  });

  const paymentMethod = watch("paymentMethod");
  const selectedCity = watch("city");

  React.useEffect(() => {
    if (items.length === 0) return;
    trackEvent("begin_checkout", {
      currency: siteConfig.currency,
      value: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
      items: items.map((item) => ({
        item_id: item.productId,
        item_name: item.name,
        price: item.unitPrice,
        quantity: item.quantity
      }))
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    setCheckoutCity(selectedCity ?? "");
  }, [selectedCity, setCheckoutCity]);

  const { data: cities = [] } = useQuery({
    queryKey: ["available-cities"],
    queryFn: fetchAvailableCities,
    staleTime: 5 * 60 * 1000
  });

  const placeOrderMutation = useMutation({
    mutationFn: placeOrder,
    onSuccess: (order, values) => {
      trackEvent("purchase", {
        transaction_id: order.id,
        currency: siteConfig.currency,
        value: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
        items: items.map((item) => ({
          item_id: item.productId,
          item_name: item.name,
          price: item.unitPrice,
          quantity: item.quantity
        }))
      });
      setOrderNumber(order.id);
      setSubmittedName(values.fullName);
      setSubmittedPhone(values.phone);
      clearCart();
    },
    onError: (error) => {
      if (
        error instanceof ApiRequestError &&
        /coupon|expired|usage limit|minimum order|sign in/i.test(error.message)
      ) {
        setAppliedCoupon(null);
      }
    }
  });

  const selectedRegion = React.useMemo(() => {
    if (!selectedCity) return undefined;
    const match = cities.find((c) => c.name === selectedCity);
    return match?.province;
  }, [selectedCity, cities]);

  function onSubmit(values: CheckoutFormValues) {
    placeOrderMutation.mutate({
      fullName: values.fullName,
      phone: values.phone,
      email: values.email,
      address: values.address,
      city: values.city,
      region: selectedRegion,
      postalCode: values.postalCode,
      deliveryNotes: values.deliveryNotes,
      paymentMethod: values.paymentMethod,
      couponCode: appliedCoupon?.code,
      items: items.map((item) => ({
        productId: item.productId,
        name: item.name,
        color: item.selectedColor,
        length: item.selectedLength,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    });
  }

  const submitError =
    placeOrderMutation.error instanceof ApiRequestError
      ? placeOrderMutation.error.message
      : placeOrderMutation.isError
        ? "Something went wrong placing your order. Please try again."
        : null;

  const orderTotal = Math.max(
    0,
    useCartStore.getState().subtotal() - (appliedCoupon?.discountAmount ?? 0)
  );

  if (orderNumber) {
    return (
      <div className="rounded-card border border-charcoal/[0.08] bg-white p-6 text-center sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest/10">
          <CheckCircle2 className="h-7 w-7 text-forest" />
        </div>
        <h2 className="mt-4 font-serif text-display-sm text-charcoal sm:text-display-md">
          Thank you, {submittedName}
        </h2>
        <p className="mt-1.5 text-[14px] text-charcoal/60">
          Your order has been placed successfully.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-forest/[0.06] px-3.5 py-1.5">
          <span className="text-[12px] font-medium text-charcoal/55">Order ID</span>
          <span className="text-[12px] font-semibold text-charcoal">{orderNumber}</span>
        </div>
        <Separator className="my-5" />
        <div className="space-y-1.5 text-[13px] text-charcoal/55">
          <p>We&apos;ll confirm your order details shortly.</p>
          <p>
            A confirmation will be sent to{" "}
            <span className="font-medium text-charcoal">{submittedPhone}</span>.
          </p>
        </div>
        <p className="mt-3 text-[11px] text-charcoal/40">
          Please save your order ID for your records.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-0" noValidate>
      {/* Single card: contact + delivery + payment — less vertical chrome */}
      <div className="rounded-card border border-charcoal/[0.08] bg-white p-4 sm:p-5">
        {/* Contact */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-forest/10">
            <User className="h-3.5 w-3.5 text-forest" />
          </div>
          <div>
            <p className="text-[15px] font-medium text-charcoal">Contact Information</p>
            <p className="text-[12px] text-charcoal/45">How we&apos;ll reach you</p>
          </div>
        </div>

        <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="fullName" className="mb-1 block text-[12px]">
              Full Name
            </Label>
            <div className="relative">
              <Input
                id="fullName"
                placeholder="Your full name"
                className={fieldInputClass}
                {...register("fullName")}
              />
              <User className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-charcoal/30" />
            </div>
            {errors.fullName && (
              <p className="mt-1 text-[11px] text-red-500" role="alert">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="phone" className="mb-1 block text-[12px]">
              Phone Number
            </Label>
            <div className="relative">
              <Input
                id="phone"
                placeholder="03XXXXXXXXX"
                className={fieldInputClass}
                {...register("phone")}
              />
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-charcoal/30" />
            </div>
            {errors.phone && (
              <p className="mt-1 text-[11px] text-red-500" role="alert">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="email" className="mb-1 block text-[12px]">
              Email
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className={fieldInputClass}
                {...register("email")}
              />
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-charcoal/30" />
            </div>
            {errors.email && (
              <p className="mt-1 text-[11px] text-red-500" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Delivery */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-forest/10">
            <MapPin className="h-3.5 w-3.5 text-forest" />
          </div>
          <div>
            <p className="text-[15px] font-medium text-charcoal">Delivery Address</p>
            <p className="text-[12px] text-charcoal/45">Where should we deliver?</p>
          </div>
        </div>

        <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="address" className="mb-1 block text-[12px]">
              Street Address
            </Label>
            <div className="relative">
              <Input
                id="address"
                placeholder="House number, street, area"
                className={fieldInputClass}
                {...register("address")}
              />
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-charcoal/30" />
            </div>
            {errors.address && (
              <p className="mt-1 text-[11px] text-red-500" role="alert">
                {errors.address.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="city" className="mb-1 block text-[12px]">
              City
            </Label>
            <select id="city" className={selectClass} {...register("city")}>
              <option value="">Select a city</option>
              {cities.map((city) => (
                <option key={city.name} value={city.name}>
                  {city.name} ({city.province})
                </option>
              ))}
            </select>
            {errors.city && (
              <p className="mt-1 text-[11px] text-red-500" role="alert">
                {errors.city.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="region" className="mb-1 block text-[12px]">
              Region / Province
            </Label>
            <Input
              id="region"
              value={selectedRegion ?? ""}
              readOnly
              placeholder="Auto-filled from city"
              className="h-10 bg-charcoal/[0.02] text-[13px]"
            />
          </div>

          <div>
            <Label htmlFor="postalCode" className="mb-1 block text-[12px]">
              Postal Code
            </Label>
            <Input
              id="postalCode"
              placeholder="e.g. 38000"
              className="h-10 text-[13px]"
              {...register("postalCode")}
            />
            {errors.postalCode && (
              <p className="mt-1 text-[11px] text-red-500" role="alert">
                {errors.postalCode.message}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="deliveryNotes" className="mb-1 block text-[12px]">
              Delivery Notes{" "}
              <span className="font-normal text-charcoal/40">(optional)</span>
            </Label>
            <Textarea
              id="deliveryNotes"
              placeholder="Landmarks, gate code, preferred time…"
              className="min-h-[64px] text-[13px]"
              {...register("deliveryNotes")}
            />
          </div>
        </div>

        <Separator className="my-4" />

        {/* Payment */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-forest/10">
            <CreditCard className="h-3.5 w-3.5 text-forest" />
          </div>
          <div>
            <p className="text-[15px] font-medium text-charcoal">Payment Method</p>
            <p className="text-[12px] text-charcoal/45">How you&apos;d like to pay</p>
          </div>
        </div>

        <div className="mt-3">
          <label
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border-2 px-3.5 py-3 transition-all",
              paymentMethod === "Cash on Delivery"
                ? "border-forest bg-forest/[0.03] ring-1 ring-forest/15"
                : "border-charcoal/10 hover:border-charcoal/20"
            )}
          >
            <input
              type="radio"
              value="Cash on Delivery"
              checked={paymentMethod === "Cash on Delivery"}
              onChange={() => {}}
              className="sr-only"
            />
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                paymentMethod === "Cash on Delivery" ? "bg-forest/10" : "bg-charcoal/[0.04]"
              )}
            >
              <Truck
                className={cn(
                  "h-4 w-4",
                  paymentMethod === "Cash on Delivery" ? "text-forest" : "text-charcoal/40"
                )}
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[13px] font-medium text-charcoal">Cash on Delivery</span>
              <p className="text-[11px] text-charcoal/50">Pay when your fabric arrives</p>
            </div>
            <div
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                paymentMethod === "Cash on Delivery" ? "border-forest" : "border-charcoal/20"
              )}
            >
              {paymentMethod === "Cash on Delivery" && (
                <div className="h-2 w-2 rounded-full bg-forest" />
              )}
            </div>
          </label>
        </div>
      </div>

      {submitError && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
          <p className="text-[12px] text-red-600" role="alert">
            {submitError}
          </p>
        </div>
      )}

      <div className="mt-4">
        <Button
          type="submit"
          size="lg"
          disabled={placeOrderMutation.isPending || items.length === 0}
          className="h-12 w-full text-[14px] font-semibold sm:h-12"
        >
          {placeOrderMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Placing Order…
            </>
          ) : (
            <>
              Place Order
              <span className="mx-1 text-cream/60">·</span>
              <span className="font-normal text-cream/85">{formatPrice(orderTotal)}</span>
            </>
          )}
        </Button>
        <p className="mt-2 text-center text-[11px] text-charcoal/40">
          By placing this order you agree to our terms of service.
        </p>
      </div>
    </form>
  );
}
