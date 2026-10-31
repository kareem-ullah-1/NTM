"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Banknote,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Package,
  Printer,
  Send,
  ShoppingCart,
  Tag,
  Trash2,
  User,
  X,
  CreditCard
} from "lucide-react";
import type { ApiOrder } from "@/lib/api/types";
import { cn, formatPrice } from "@/lib/utils";
import { queryKeys } from "@/lib/api/query-keys";
import { statusVariant } from "@/lib/status-styles";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  fetchOrderPayment,
  updatePaymentStatus,
  collectCodPayment
} from "@/lib/api/payments";
import { ApiRequestError } from "@/lib/api/client";
import { useToastStore } from "@/store/use-toast-store";

const GENERIC_PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
  "cancelled"
] as const;

const statusTimeline: Record<
  ApiOrder["status"],
  { label: string; icon: typeof Package; color: string }[]
> = {
  Pending: [
    {
      label: "Order Placed",
      icon: ShoppingCart,
      color: "text-amber-500"
    }
  ],
  Confirmed: [
    {
      label: "Order Placed",
      icon: ShoppingCart,
      color: "text-amber-500"
    },
    {
      label: "Order Confirmed",
      icon: CheckCircle2,
      color: "text-blue-500"
    }
  ],
  Shipped: [
    {
      label: "Order Placed",
      icon: ShoppingCart,
      color: "text-amber-500"
    },
    {
      label: "Order Confirmed",
      icon: CheckCircle2,
      color: "text-blue-500"
    },
    {
      label: "Shipped",
      icon: Send,
      color: "text-violet-500"
    }
  ],
  Delivered: [
    {
      label: "Order Placed",
      icon: ShoppingCart,
      color: "text-amber-500"
    },
    {
      label: "Order Confirmed",
      icon: CheckCircle2,
      color: "text-blue-500"
    },
    {
      label: "Shipped",
      icon: Send,
      color: "text-violet-500"
    },
    {
      label: "Delivered",
      icon: Package,
      color: "text-emerald-500"
    }
  ],
  Cancelled: [
    {
      label: "Order Placed",
      icon: ShoppingCart,
      color: "text-amber-500"
    },
    {
      label: "Cancelled",
      icon: Trash2,
      color: "text-red-500"
    }
  ]
};

const paymentMethodLabels: Record<string, string> = {
  "Cash on Delivery": "Cash on Delivery",
  "Easypaisa / JazzCash": "Easypaisa / JazzCash",
  "Bank Transfer": "Bank Transfer"
};

export function OrderDetailPanel({
  order,
  onClose
}: {
  order: ApiOrder | null;
  onClose: () => void;
}) {
  const router = useRouter();

  return (
    <AnimatePresence>
      {order && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-charcoal/50 backdrop-blur-sm"
            aria-hidden="true"
          />
          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-label="Order details"
            className="fixed inset-y-0 right-0 z-[80] flex w-full flex-col overflow-hidden bg-white sm:w-[480px] lg:w-[520px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-charcoal/[0.06] px-6 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-lg font-medium text-charcoal">
                    Order Details
                  </h2>
                  <Badge variant={statusVariant[order.status]}>
                    {order.status}
                  </Badge>
                </div>
                <p className="mt-0.5 font-mono text-[12px] text-charcoal/40">
                  {order.id}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    router.push(
                      `/admin/orders/${encodeURIComponent(order.id)}/invoice`
                    )
                  }
                  aria-label="Print invoice"
                  title="Open Invoice"
                  className="flex items-center gap-1.5 rounded-lg border border-charcoal/[0.10] px-3 py-1.5 text-[12px] font-medium text-charcoal/60 transition-colors hover:bg-charcoal/[0.03] hover:text-charcoal"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Invoice</span>
                </button>
                <button
                  onClick={onClose}
                  aria-label="Close order details"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-charcoal/40 transition-colors hover:bg-charcoal/[0.04] hover:text-charcoal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Order Summary */}
              <OrderSummarySection order={order} />

              {/* Customer Information */}
              <CustomerSection order={order} />

              {/* Payment Information */}
              <PaymentSection order={order} />

              {/* Order Items */}
              <ItemsSection order={order} />

              {/* Order Timeline */}
              <TimelineSection order={order} />

              {/* Administrative Actions */}
              <ActionsSection order={order} onClose={onClose} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


function SectionHeader({
  icon: Icon,
  title
}: {
  icon: typeof Package;
  title: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-4 w-4 text-charcoal/30" />
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
        {title}
      </h3>
    </div>
  );
}

function OrderSummarySection({ order }: { order: ApiOrder }) {
  return (
    <div className="mb-6">
      {/* Amount */}
      <div className="rounded-[10px] border border-charcoal/[0.06] bg-charcoal/[0.015] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-charcoal/40">
              Order Total
            </p>
            <p className="mt-1 font-serif text-2xl font-medium text-charcoal">
              {formatPrice(order.amount)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-charcoal/40">
              Items
            </p>
            <p className="mt-1 text-lg font-medium text-charcoal">
              {order.items.length}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4 text-[12px] text-charcoal/50">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {order.date}
          </span>
          <span className="flex items-center gap-1">
            <Tag className="h-3 w-3" />
            {order.paymentMethod}
          </span>
        </div>
      </div>
    </div>
  );
}

function CustomerSection({ order }: { order: ApiOrder }) {
  return (
    <div className="mb-6">
      <SectionHeader icon={User} title="Customer Information" />
      <div className="rounded-[10px] border border-charcoal/[0.06] p-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-charcoal/[0.04]">
              <User className="h-4 w-4 text-charcoal/40" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-charcoal">
                {order.customerName}
              </p>
              <p className="text-[12px] text-charcoal/45">
                {order.customerPhone}
              </p>
              {order.customerEmail && (
                <p className="text-[12px] text-charcoal/45">
                  {order.customerEmail}
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-charcoal/[0.06] pt-3">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-charcoal/30" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-charcoal/35">
                  Delivery Address
                </p>
                <p className="mt-1 text-[13px] text-charcoal/70">
                  {order.address}
                </p>
                <p className="text-[12px] text-charcoal/45">
                  {[order.city, order.region].filter(Boolean).join(", ")}
                  {order.postalCode ? ` — ${order.postalCode}` : ""}
                </p>
                {order.deliveryNotes && (
                  <p className="mt-1 text-[12px] italic text-charcoal/40">
                    Note: {order.deliveryNotes}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentSection({ order }: { order: ApiOrder }) {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [transactionRef, setTransactionRef] = React.useState("");

  const {
    data: payment,
    isLoading
  } = useQuery({
    queryKey: ["order-payment", order.id],
    queryFn: () => fetchOrderPayment(order.id)
  });

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["order-payment", order.id]
    });
  const onError = (error: unknown) =>
    showToast(
      error instanceof ApiRequestError
        ? error.message
        : "Failed to update payment.", "error"
    );

  const collectMutation = useMutation({
    mutationFn: () => collectCodPayment(payment!.id),
    onSuccess: () => {
      showToast("Payment marked as collected");
      invalidate();
    },
    onError
  });

  const genericStatusMutation = useMutation({
    mutationFn: (status: (typeof GENERIC_PAYMENT_STATUSES)[number]) =>
      updatePaymentStatus(payment!.id, {
        status,
        transactionRef: transactionRef || undefined
      }),
    onSuccess: () => {
      showToast("Payment status updated");
      invalidate();
    },
    onError
  });

  if (isLoading || !payment) return null;

  const isCod = payment.provider === "cod";
  const paymentStatusLabel =
    payment.status === "paid"
      ? "Paid"
      : payment.status === "pending"
        ? "Pending"
        : payment.status === "failed"
          ? "Failed"
          : payment.status === "refunded"
            ? "Refunded"
            : "Cancelled";

  return (
    <div className="mb-6">
      <SectionHeader icon={CreditCard} title="Payment Information" />
      <div className="rounded-[10px] border border-charcoal/[0.06] p-4">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-charcoal/45">Method</span>
            <span className="text-[13px] text-charcoal/70">
              {paymentMethodLabels[order.paymentMethod] ?? order.paymentMethod}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-charcoal/45">Status</span>
            <Badge
              variant={
                payment.status === "paid"
                  ? "success"
                  : payment.status === "failed"
                    ? "danger"
                    : "outline"
              }
            >
              {paymentStatusLabel}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-charcoal/45">Amount</span>
            <span className="text-[13px] font-medium text-charcoal">
              {formatPrice(payment.amount)}
            </span>
          </div>
          {payment.status === "paid" && payment.paidAt && (
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-charcoal/45">
                {isCod ? "Collected" : "Paid"} at
              </span>
              <span className="text-[12px] text-charcoal/55">
                {new Date(payment.paidAt).toLocaleString()}
              </span>
            </div>
          )}
          {payment.transactionRef && (
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-charcoal/45">
                Transaction Ref
              </span>
              <span className="font-mono text-[12px] text-charcoal/55">
                {payment.transactionRef}
              </span>
            </div>
          )}
        </div>

        {/* Payment Actions */}
        {isCod ? (
          payment.status === "pending" && (
            <div className="mt-4 border-t border-charcoal/[0.06] pt-3">
              <Button
                type="button"
                size="sm"
                className="w-full"
                disabled={collectMutation.isPending}
                onClick={() => collectMutation.mutate()}
              >
                <Banknote className="h-4 w-4" />
                {collectMutation.isPending
                  ? "Processing..."
                  : "Mark Payment Collected"}
              </Button>
            </div>
          )
        ) : (
          <>
            {payment.status !== "paid" && payment.status !== "refunded" && (
              <div className="mt-4 border-t border-charcoal/[0.06] pt-3">
                <Input
                  placeholder="Transaction reference (optional)"
                  value={transactionRef}
                  onChange={(event) => setTransactionRef(event.target.value)}
                  className="mb-2 text-[12px]"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1"
                    disabled={genericStatusMutation.isPending}
                    onClick={() => genericStatusMutation.mutate("paid")}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Mark Paid
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={genericStatusMutation.isPending}
                    onClick={() => genericStatusMutation.mutate("failed")}
                  >
                    Mark Failed
                  </Button>
                </div>
              </div>
            )}
            {payment.status === "paid" && (
              <div className="mt-4 border-t border-charcoal/[0.06] pt-3">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full"
                  disabled={genericStatusMutation.isPending}
                  onClick={() => genericStatusMutation.mutate("refunded")}
                >
                  Refund Payment
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ItemsSection({ order }: { order: ApiOrder }) {
  return (
    <div className="mb-6">
      <SectionHeader icon={ShoppingCart} title="Order Items" />
      <div className="rounded-[10px] border border-charcoal/[0.06]">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-charcoal/[0.06] text-[10px] uppercase tracking-wider text-charcoal/35">
              <th className="px-4 py-2.5 font-semibold">Item</th>
              <th className="px-4 py-2.5 text-right font-semibold">Qty</th>
              <th className="px-4 py-2.5 text-right font-semibold">Price</th>
              <th className="px-4 py-2.5 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr
                key={item.id ?? index}
                className="border-b border-charcoal/[0.03] last:border-none"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-charcoal">{item.name}</p>
                  {(item.color || item.length) && (
                    <p className="mt-0.5 text-[11px] text-charcoal/40">
                      {[item.color, item.length].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-charcoal/60">
                  {item.quantity}
                </td>
                <td className="px-4 py-3 text-right text-charcoal/60">
                  {formatPrice(item.unitPrice)}
                </td>
                <td className="px-4 py-3 text-right font-medium text-charcoal">
                  {formatPrice(item.unitPrice * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pricing Summary */}
        <div className="border-t border-charcoal/[0.06] px-4 py-3">
          <div className="space-y-1.5 text-[13px]">
            <div className="flex justify-between">
              <span className="text-charcoal/50">Subtotal</span>
              <span className="text-charcoal/70">
                {formatPrice(order.subtotal)}
              </span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-forest">
                <span className="flex items-center gap-1">
                  Discount
                  {order.couponCode && (
                    <span className="rounded bg-forest/[0.08] px-1.5 py-0.5 text-[10px] font-medium">
                      {order.couponCode}
                    </span>
                  )}
                </span>
                <span>-{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            {order.promoDiscount && order.promoDiscount > 0 && (
              <div className="flex justify-between text-forest">
                <span>Promo Discount</span>
                <span>-{formatPrice(order.promoDiscount)}</span>
              </div>
            )}
            {order.walletAmountUsed && order.walletAmountUsed > 0 && (
              <div className="flex justify-between text-forest">
                <span>Wallet Used</span>
                <span>-{formatPrice(order.walletAmountUsed)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-charcoal/[0.08] pt-2 text-base font-medium">
              <span className="text-charcoal">Total</span>
              <span className="text-charcoal">{formatPrice(order.amount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineSection({ order }: { order: ApiOrder }) {
  const steps = statusTimeline[order.status] || [];

  return (
    <div className="mb-6">
      <SectionHeader icon={Clock} title="Order Timeline" />
      <div className="rounded-[10px] border border-charcoal/[0.06] p-4">
        <div className="space-y-0">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            return (
              <div key={step.label} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      isLast
                        ? "bg-charcoal/[0.06]"
                        : "bg-charcoal/[0.03]"
                    }`}
                  >
                    <step.icon className={`h-3 w-3 ${step.color}`} />
                  </div>
                  {!isLast && (
                    <div className="my-1 h-6 w-px bg-charcoal/[0.08]" />
                  )}
                </div>
                <div className="pb-4">
                  <p
                    className={`text-[13px] ${
                      isLast
                        ? "font-medium text-charcoal"
                        : "text-charcoal/50"
                    }`}
                  >
                    {step.label}
                  </p>
                  {isLast && (
                    <p className="mt-0.5 text-[11px] text-charcoal/35">
                      Current status
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ActionsSection({
  order
}: {
  order: ApiOrder;
  onClose: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const params = { limit: 100 };

  const statusMutation = useMutation({
    mutationFn: ({ status }: { status: ApiOrder["status"] }) =>
      import("@/lib/api/orders").then((m) =>
        m.updateOrderStatus(order.id, status)
      ),
    onSuccess: (updated) => {
      queryClient.setQueryData<{ data: ApiOrder[]; meta: unknown }>(
        queryKeys.orders.list(params),
        (current) =>
          current
            ? {
                ...current,
                data: current.data.map((o) =>
                  o.id === updated.id ? updated : o
                )
              }
            : current
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
      showToast(`Order updated to ${updated.status}`);
    },
    onError: (error: unknown) => {
      showToast(
        error instanceof ApiRequestError
          ? error.message
          : "Failed to update order.", "error"
      );
    }
  });

  const statusActions: {
    label: string;
    icon: typeof Package;
    status: ApiOrder["status"];
  }[] = [];

  if (order.status === "Pending") {
    statusActions.push({
      label: "Confirm Order",
      icon: CheckCircle2,
      status: "Confirmed"
    });
  }
  if (order.status === "Confirmed") {
    statusActions.push({
      label: "Mark as Shipped",
      icon: Send,
      status: "Shipped"
    });
  }
  if (order.status === "Shipped") {
    statusActions.push({
      label: "Mark as Delivered",
      icon: Package,
      status: "Delivered"
    });
  }
  if (order.status !== "Cancelled" && order.status !== "Delivered") {
    statusActions.push({
      label: "Cancel Order",
      icon: Trash2,
      status: "Cancelled"
    });
  }

  return (
    <div>
      <SectionHeader icon={CheckCircle2} title="Actions" />
      <div className="space-y-2">
        {/* Invoice */}
        <button
          onClick={() =>
            router.push(
              `/admin/orders/${encodeURIComponent(order.id)}/invoice`
            )
          }
          className="flex w-full items-center gap-3 rounded-[10px] border border-charcoal/[0.06] px-4 py-3 text-left transition-colors hover:bg-charcoal/[0.02]"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-charcoal/[0.04]">
            <FileText className="h-4 w-4 text-charcoal/45" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-charcoal">
              Print Invoice
            </p>
            <p className="text-[11px] text-charcoal/40">
              Opens the invoice in a new view for printing
            </p>
          </div>
        </button>

        {/* Status changes */}
        {statusActions.map((action) => (
          <button
            key={action.status}
            disabled={statusMutation.isPending}
            onClick={() =>
              statusMutation.mutate({ status: action.status })
            }
            className={cn(
              "flex w-full items-center gap-3 rounded-[10px] border px-4 py-3 text-left transition-colors disabled:opacity-50",
              action.status === "Cancelled"
                ? "border-red-100 hover:bg-red-50/50"
                : "border-charcoal/[0.06] hover:bg-charcoal/[0.02]"
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                action.status === "Cancelled"
                  ? "bg-red-50"
                  : "bg-charcoal/[0.04]"
              )}
            >
              <action.icon
                className={cn(
                  "h-4 w-4",
                  action.status === "Cancelled"
                    ? "text-red-400"
                    : "text-charcoal/45"
                )}
              />
            </div>
            <div>
              <p
                className={cn(
                  "text-[13px] font-medium",
                  action.status === "Cancelled"
                    ? "text-red-600"
                    : "text-charcoal"
                )}
              >
                {action.label}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
