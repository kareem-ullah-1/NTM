import { Suspense } from "react";
import { OrdersTable } from "@/components/admin/OrdersTable";

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-display-md text-charcoal">
            Orders
          </h1>
          <p className="mt-1 text-[13px] text-charcoal/50">
            Manage customer orders, track status, and process payments.
          </p>
        </div>
      </div>
      <Suspense fallback={null}>
        <OrdersTable />
      </Suspense>
    </div>
  );
}
