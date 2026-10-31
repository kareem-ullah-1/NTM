import { Suspense } from "react";
import { PromotionsManager } from "@/components/admin/PromotionsManager";

export const metadata = {
  title: "Promotions | NTM Fabrics Admin",
};

export default function AdminPromotionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-charcoal">
          Promotions
        </h1>
        <p className="text-sm text-charcoal/50">
          Create and manage discount campaigns for your store.
        </p>
      </div>
      <Suspense fallback={null}>
        <PromotionsManager />
      </Suspense>
    </div>
  );
}
