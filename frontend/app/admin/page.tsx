"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Banknote, Loader2, LockKeyhole, Package, ShoppingCart, TriangleAlert, Eye, EyeOff } from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { SalesChart } from "@/components/admin/SalesChart";
import { RecentOrdersTable } from "@/components/admin/RecentOrdersTable";
import { BestSellersCard } from "@/components/admin/BestSellersCard";
import { CouponPerformanceCard } from "@/components/admin/CouponPerformanceCard";
import { fetchDashboardStats } from "@/lib/api/dashboard";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { formatPrice } from "@/lib/utils";
import { useAdminAuthStore } from "@/store/use-admin-auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function AdminLoginPage() {
  const router = useRouter();
  const login = useAdminAuthStore((state) => state.login);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [formError, setFormError] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const success = await login(email, password);
      if (!success) throw new Error(useAdminAuthStore.getState().error ?? "Invalid email or password.");
      return success;
    },
    onSuccess: () => {
      const loggedInUser = useAdminAuthStore.getState().user;
      if (loggedInUser?.role === "admin" && loggedInUser.emailVerified === false) {
        router.replace("/admin/verify-email");
        return;
      }
      router.replace("/admin");
    }
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setFormError("Enter an email and password to continue.");
      return;
    }
    setFormError("");
    loginMutation.mutate({ email: email.trim(), password });
  }

  const error = formError || (loginMutation.isError ? loginMutation.error.message : "");

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm rounded-card border border-charcoal/10 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-forest/8 text-forest">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-serif text-2xl text-charcoal">Admin Login</h1>
          <p className="mt-2 text-sm text-charcoal/60">Sign in to manage inventory and orders.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="admin@ntmfabrics.pk"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loginMutation.isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-password">Password</Label>
            <div className="relative">
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loginMutation.isPending}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal/60"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              "Log In"
            )}
          </Button>
        </form>

      </div>
    </div>
  );
}

function AdminDashboard() {
  const {
    data: stats,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: fetchDashboardStats
  });

  const loadError = isError
    ? error instanceof ApiRequestError
      ? error.message
      : "Failed to load dashboard stats."
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-display-md text-charcoal">Overview</h1>
        <p className="text-[13px] text-charcoal/50">
          A snapshot of NTM Fabrics store performance.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-charcoal/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading dashboard...
        </div>
      ) : loadError ? (
        <p className="py-16 text-center text-[13px] text-red-500">
          {loadError}
        </p>
      ) : stats ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              icon={Banknote}
              label="Total Sales"
              value={formatPrice(stats.totalSales)}
            />
            <StatCard
              icon={ShoppingCart}
              label="Orders"
              value={String(stats.orderCount)}
            />
            <StatCard
              icon={Package}
              label="Products"
              value={String(stats.productCount)}
            />
            <Link href="/admin/inventory?status=Low Stock" className="block">
              <StatCard
                icon={TriangleAlert}
                label="Low Stock"
                value={String(stats.lowStockCount)}
              />
            </Link>
            <Link href="/admin/inventory?status=Out of Stock" className="block">
              <StatCard
                icon={TriangleAlert}
                label="Out of Stock"
                value={String(stats.outOfStockCount)}
              />
            </Link>
          </div>
          <SalesChart />

          <BestSellersCard />

          <CouponPerformanceCard />
        </>
      ) : null}

      <RecentOrdersTable />
    </div>
  );
}

export default function AdminOverviewPage() {
  const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated);
  const role = useAdminAuthStore((state) => state.user?.role);
  const hasHydrated = useAdminAuthStore((state) => state.hasHydrated);

  const isAdmin = isAuthenticated && role === "admin";

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <Loader2 className="h-5 w-5 animate-spin text-charcoal/40" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <AdminLoginPage />;
  }

  return <AdminDashboard />;
}
