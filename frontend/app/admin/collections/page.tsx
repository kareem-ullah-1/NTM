import { CollectionsManager } from "@/components/admin/CollectionsManager";

export const metadata = { title: "Collections Management | NTM Fabrics Admin" };

export default function AdminCollectionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-display-md text-charcoal">Collections Management</h1>
        <p className="text-sm text-charcoal/55">
          Manage navigation collections displayed on the storefront navbar.
        </p>
      </div>
      <CollectionsManager />
    </div>
  );
}
