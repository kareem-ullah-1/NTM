import { InventoryGrid } from "@/components/admin/InventoryGrid";

export default function AdminInventoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-display-md text-charcoal">
            Inventory
          </h1>
          <p className="mt-1 text-[13px] text-charcoal/50">
            Manage fabric stock, pricing, product details, and inventory status.
          </p>
        </div>
      </div>
      <InventoryGrid />
    </div>
  );
}
