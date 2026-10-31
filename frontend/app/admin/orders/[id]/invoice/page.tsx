"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer } from "lucide-react";
import { fetchOrder } from "@/lib/api/orders";
import { queryKeys } from "@/lib/api/query-keys";
import { ApiRequestError } from "@/lib/api/client";
import { InvoicePrintView } from "@/components/admin/InvoicePrintView";
import { Button } from "@/components/ui/button";

export default function OrderInvoicePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orderId = params.id;
  const hasAutoPrintedRef = React.useRef(false);

  const { data: order, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: () => fetchOrder(orderId)
  });

  React.useEffect(() => {
    if (!order || hasAutoPrintedRef.current) return;
    hasAutoPrintedRef.current = true;
    const timer = window.setTimeout(() => window.print(), 200);
    return () => window.clearTimeout(timer);
  }, [order]);

  if (isLoading) {
    return (
      <div className="no-print flex min-h-[50vh] items-center justify-center text-sm text-charcoal/55">
        Loading invoice...
      </div>
    );
  }

  if (isError || !order) {
    const message =
      error instanceof ApiRequestError && error.status === 404
        ? `Order ${orderId} could not be found.`
        : "Failed to load this order's invoice.";
    return (
      <div className="no-print flex min-h-[50vh] flex-col items-center justify-center gap-4 text-sm text-charcoal/70">
        <p>{message}</p>
        <Button variant="outline" onClick={() => router.push("/admin/orders")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push("/admin/orders")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Orders
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="mr-1.5 h-4 w-4" />
          Print
        </Button>
      </div>
      <InvoicePrintView order={order} />
    </div>
  );
}
