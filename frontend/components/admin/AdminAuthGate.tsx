"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuthStore } from "@/store/use-admin-auth-store";
import { AdminShell } from "@/components/admin/AdminShell";

const ADMIN_ROLES = new Set(["admin"]);

const PUBLIC_ENTRY_ROUTES = new Set(["/admin", "/admin/login"]);

export function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated);
  const role = useAdminAuthStore((state) => state.user?.role);
  const emailVerified = useAdminAuthStore((state) => state.user?.emailVerified);
  const hasHydrated = useAdminAuthStore((state) => state.hasHydrated);

  const isPublicEntryRoute = PUBLIC_ENTRY_ROUTES.has(pathname);
  const isVerifyRoute = pathname === "/admin/verify-email";

  const isAdmin = isAuthenticated && !!role && ADMIN_ROLES.has(role);

  const isVerified = emailVerified !== false;

  React.useEffect(() => {
    if (!hasHydrated) return;

    if (isPublicEntryRoute) {

      if (!isAdmin) return;

      if (!isVerified) {
        router.replace("/admin/verify-email");
        return;
      }
      if (pathname === "/admin/login") {
        router.replace("/admin");
      }
      return;
    }

    if (isVerifyRoute) {

      if (!isAdmin) {
        router.replace("/admin");
        return;
      }

      if (isVerified) {
        router.replace("/admin");
      }
      return;
    }

    if (!isAdmin) {
      router.replace("/admin");
      return;
    }
    if (!isVerified) {
      router.replace("/admin/verify-email");
    }
  }, [hasHydrated, pathname, isPublicEntryRoute, isVerifyRoute, isAdmin, isVerified, router]);

  if (isPublicEntryRoute) {
    if (!hasHydrated) {
      return <div className="min-h-screen bg-cream" />;
    }

    if (isAdmin && isVerified && pathname === "/admin") {
      return <AdminShell>{children}</AdminShell>;
    }

    return <>{children}</>;
  }

  if (!hasHydrated || !isAdmin) {
    return <div className="min-h-screen bg-cream" />;
  }

  if (isVerifyRoute) {

    return isVerified ? <div className="min-h-screen bg-cream" /> : <>{children}</>;
  }

  if (!isVerified) {
    return <div className="min-h-screen bg-cream" />;
  }

  return <AdminShell>{children}</AdminShell>;
}
