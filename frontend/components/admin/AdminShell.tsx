"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingCart,
  Settings,
  Star,
  X,
  Ticket,
  ShieldCheck,
  Timer,
  Zap,
  LayoutList
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminAuthStore } from "@/store/use-admin-auth-store";

const navItems = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, permission: "dashboard.view" },
  { label: "Inventory", href: "/admin/inventory", icon: Package, permission: "products.manage" },
  { label: "Catalog", href: "/admin/catalog", icon: Settings, permission: "categories.manage" },
  { label: "Collections", href: "/admin/collections", icon: LayoutList, permission: "categories.manage" },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart, permission: "orders.manage" },
  { label: "Coupons", href: "/admin/coupons", icon: Ticket, permission: "coupons.manage" },
  { label: "Promotions", href: "/admin/promotions", icon: Timer, permission: "promotions.manage" },
  { label: "Product Drops", href: "/admin/drops", icon: Zap, permission: "promotions.manage" },
  { label: "Reviews", href: "/admin/reviews", icon: Star, permission: "reviews.manage" },
  { label: "Staff", href: "/admin/staff", icon: ShieldCheck, permission: "staff.manage" }
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const reduced = useReducedMotion();
  const logout = useAdminAuthStore((state) => state.logout);
  const user = useAdminAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);

  function handleLogout() {
    logout();
    queryClient.clear();
    router.replace("/");
  }

  const permissions = user?.permissions;
  const isSuperAdmin = user?.adminRole === "super_admin";
  const accountType = isSuperAdmin ? "Super Admin" : "Staff";
  const visibleNavItems = navItems.filter(
    (item) => isSuperAdmin || permissions?.includes(item.permission)
  );

  return (
    <div className="flex min-h-screen bg-cream">
      {}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-charcoal/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-charcoal transition-transform duration-300 lg:static lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {}
        <div className="flex h-16 items-center justify-between border-b border-cream/[0.06] px-5">
          <span className="font-serif text-[13px] font-medium tracking-[0.08em] text-cream/80">
            NTM FABRICS
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-cream/50 hover:text-cream lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-cream/25">
            Dashboard
          </p>
          <div className="space-y-0.5">
            {visibleNavItems.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-[13px] font-medium transition-colors duration-200",
                    active
                      ? "text-cream"
                      : "text-cream/45 hover:bg-cream/[0.04] hover:text-cream/70"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="admin-nav-active"
                      className="absolute inset-0 rounded-[8px] bg-cream/[0.08]"
                      transition={
                        reduced
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 420, damping: 34 }
                      }
                    />
                  )}
                  <item.icon className="relative z-10 h-4 w-4" />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {}
        <div className="border-t border-cream/[0.06] px-3 py-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-[13px] font-medium text-cream/40 transition-colors hover:bg-cream/[0.04] hover:text-cream/70"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </aside>

      {}
      <div className="flex-1 overflow-x-hidden">
        {}
        <header className="flex h-16 items-center justify-between border-b border-charcoal/[0.06] bg-white px-4 sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            className="flex h-9 w-9 items-center justify-center rounded-full text-charcoal/60 hover:bg-charcoal/5 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/"
              className="hidden text-[12px] text-charcoal/45 transition-colors hover:text-charcoal sm:inline"
            >
              View Store
            </Link>
            <div className="hidden text-right sm:block">
              <p className="text-[12px] font-medium text-charcoal/80 leading-tight">
                {user?.name ?? "Admin"}
              </p>
              <p className="text-[10px] text-charcoal/40 leading-tight">
                {accountType}
              </p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-charcoal text-[12px] font-medium text-cream">
              {user?.name
                ? user.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "NF"}
            </span>
          </div>
        </header>

        {}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
