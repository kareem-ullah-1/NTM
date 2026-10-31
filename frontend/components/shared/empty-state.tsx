import * as React from "react";
import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-charcoal/12 bg-white/70 px-6 py-14 text-center sm:py-16"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forest/[0.08] text-forest">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="space-y-1.5">
        <p className="font-serif text-lg text-charcoal sm:text-xl">{title}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-[13px] leading-relaxed text-charcoal/55">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
