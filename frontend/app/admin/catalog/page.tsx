import { CatalogManager } from "@/components/admin/CatalogManager";

export const metadata = { title: "Catalog Management | NTM Fabrics Admin" };

export default function AdminCatalogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-display-md text-charcoal">Catalog Management</h1>
        <p className="text-sm text-charcoal/55">
          Manage categories and fabric types used across your product catalog.
        </p>
      </div>
      <CatalogManager />
    </div>
  );
}
