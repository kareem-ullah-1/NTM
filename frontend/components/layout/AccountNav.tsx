"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  LogOut,
  ShoppingBag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminAuthStore } from "@/store/use-admin-auth-store";
import { useCartStore } from "@/store/use-cart-store";

const ADMIN_ROLES = new Set(["admin"]);

export function AccountNav() {
  const router = useRouter();
  const role = useAdminAuthStore((state) => state.user?.role);
  const hasHydrated = useAdminAuthStore((state) => state.hasHydrated);
  const logout = useAdminAuthStore((state) => state.logout);
  const totalItems = useCartStore((state) => state.totalItems());
  const openCartDrawer = useCartStore((state) => state.openCartDrawer);
  const queryClient = useQueryClient();
  const isAdmin = !!role && ADMIN_ROLES.has(role);

  function handleLogout() {
    logout();
    queryClient.clear();
    router.replace("/");
  }

  if (!hasHydrated) {
    return <div className="h-10 w-16" aria-hidden="true" />;
  }

  if (isAdmin) {
    return (
      <div className="flex items-center gap-1.5">
        <Link
          href="/admin"
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-forest hover:bg-forest/5"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className="hidden sm:inline">Admin Dashboard</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex h-10 w-10 items-center justify-center rounded-full text-charcoal/60 hover:bg-charcoal/5 hover:text-maroon"
          aria-label="Log out"
        >
          <LogOut className="h-[18px] w-[18px]" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <button
        onClick={openCartDrawer}
        aria-label="View cart"
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-charcoal hover:bg-charcoal/5"
      >
        <ShoppingBag className="h-[18px] w-[18px]" />
        {totalItems > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-forest px-1 text-[10px] font-medium text-cream">
            {totalItems}
          </span>
        )}
      </button>
    </div>
  );
}
