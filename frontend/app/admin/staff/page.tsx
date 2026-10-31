import { Suspense } from "react";
import { StaffManager } from "@/components/admin/StaffManager";

export default function AdminStaffPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-charcoal">Staff & Roles</h1>
        <p className="text-sm text-charcoal/55">Manage staff accounts and their admin permissions.</p>
      </div>
      <Suspense fallback={null}>
        <StaffManager />
      </Suspense>
    </div>
  );
}
