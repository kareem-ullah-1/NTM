"use client";

import { motion, useReducedMotion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down";
};

export function StatCard({
  icon: Icon,
  label,
  value,
  change,
  trend
}: StatCardProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      whileHover={reduced ? undefined : { y: -3 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-[10px] border border-charcoal/[0.06] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,24,0.03)] transition-shadow duration-300 hover:border-charcoal/[0.1] hover:shadow-[0_16px_32px_-16px_rgba(26,26,24,0.16)]"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest/[0.06] text-forest">
          <Icon className="h-5 w-5" />
        </div>
        {change && trend && (
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
              trend === "up"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
            )}
          >
            {trend === "up" ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {change}
          </span>
        )}
      </div>
      <p className="mt-4 font-serif text-2xl font-medium tracking-tight text-charcoal">
        {value}
      </p>
      <p className="mt-0.5 text-overline uppercase text-charcoal/40">{label}</p>
    </motion.div>
  );
}
