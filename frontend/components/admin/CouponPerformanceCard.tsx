"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Tag } from "lucide-react";
import { fetchCouponPerformance } from "@/lib/api/dashboard";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function CouponPerformanceCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "dashboard", "coupon-performance"],
    queryFn: () => fetchCouponPerformance(20)
  });

  return (
    <div className="rounded-[10px] border border-charcoal/[0.06] bg-white p-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest/[0.06] text-forest">
          <Tag className="h-4 w-4" />
        </div>
        <div>
          <p className="font-serif text-lg font-medium text-charcoal">
            Coupon Performance
          </p>
          <p className="text-[11px] uppercase tracking-wide text-charcoal/35">
            Revenue per PKR of discount
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-charcoal/50">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
        </div>
      ) : !data?.length ? (
        <p className="py-10 text-center text-[13px] text-charcoal/50">
          No coupons created yet.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-charcoal/[0.06] text-overline uppercase text-charcoal/35">
                <th className="py-2.5 pr-4 font-medium">Code</th>
                <th className="py-2.5 pr-4 font-medium">Redemptions</th>
                <th className="py-2.5 pr-4 font-medium">Discount Given</th>
                <th className="py-2.5 pr-4 font-medium">Revenue</th>
                <th className="py-2.5 pr-4 font-medium">Revenue / PKR Discounted</th>
              </tr>
            </thead>
            <tbody>
              {data.map((coupon) => (
                <tr
                  key={coupon.id}
                  className="border-b border-charcoal/[0.04] last:border-none"
                >
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-charcoal">
                        {coupon.code}
                      </span>
                      {!coupon.isActive && (
                        <Badge variant="outline" className="text-[10px]">
                          inactive
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-charcoal/60">
                    {coupon.redemptionCount}
                  </td>
                  <td className="py-3 pr-4 text-charcoal/60">
                    {formatPrice(coupon.totalDiscountGiven)}
                  </td>
                  <td className="py-3 pr-4 text-charcoal/60">
                    {formatPrice(coupon.revenueFromOrders)}
                  </td>
                  <td className="py-3 pr-4">
                    {coupon.revenuePerDiscountRupee === null ? (
                      <span className="text-charcoal/30">—</span>
                    ) : (
                      <span
                        className={
                          coupon.revenuePerDiscountRupee >= 5
                            ? "font-medium text-forest"
                            : coupon.revenuePerDiscountRupee >= 2
                            ? "text-charcoal/60"
                            : "font-medium text-red-500"
                        }
                      >
                        {coupon.revenuePerDiscountRupee.toFixed(1)}x
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
