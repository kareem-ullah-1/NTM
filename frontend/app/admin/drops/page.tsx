import { Suspense } from "react";
import { ProductDropsManager } from "@/components/admin/ProductDropsManager";

export const metadata = {
  title: "Product Drops | NTM Fabrics Admin",
};

export default function AdminDropsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-charcoal">
          Product Drops
        </h1>
        <p className="text-sm text-charcoal/50">
          Create limited-release products with scheduled availability.
        </p>
      </div>
      <Suspense fallback={null}>
        <ProductDropsManager />
      </Suspense>
    </div>
  );
}
