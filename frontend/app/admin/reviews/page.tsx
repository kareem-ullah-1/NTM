import { Suspense } from "react";
import { AdminReviewsTable } from "@/components/admin/AdminReviewsTable";

export const metadata = { title: "Reviews Management | NTM Fabrics Admin" };

export default function AdminReviewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-display-md text-charcoal">Reviews Management</h1>
        <p className="text-sm text-charcoal/55">
          Moderate and manage customer product reviews. Only approved reviews appear on product pages.
        </p>
      </div>
      <Suspense fallback={null}>
        <AdminReviewsTable />
      </Suspense>
    </div>
  );
}
