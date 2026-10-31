import { Suspense } from "react";
import { CouponsManager } from "@/components/admin/CouponsManager";

export default function AdminCouponsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-charcoal">Coupons</h1>
        <p className="text-sm text-charcoal/55">Create and manage discount codes for checkout.</p>
      </div>
      <Suspense fallback={null}>
        <CouponsManager />
      </Suspense>
    </div>
  );
}
