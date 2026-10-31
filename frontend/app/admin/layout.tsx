import { AdminAuthGate } from "@/components/admin/AdminAuthGate";

export const metadata = { title: "Admin | NTM Fabrics" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminAuthGate>{children}</AdminAuthGate>;
}
