import type { ComponentType } from "react";
import { Ruler, MoveHorizontal, Sparkles } from "lucide-react";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";

type QuickFact = {
  Icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
};

function findSpec(product: Product, labels: string[]) {
  const wanted = new Set(labels);
  return product.specifications?.find((spec) =>
    wanted.has(spec.label.toLowerCase().trim())
  )?.value?.trim();
}

function useQuickFacts(product: Product, selectedLength?: string): QuickFact[] {
  const facts: QuickFact[] = [];

  if ((product.availableLengths?.length ?? 0) <= 1) {
    const length = (product.availableLengths?.[0] ?? selectedLength)?.trim();
    if (length) {
      facts.push({ Icon: Ruler, label: "Length", value: length });
    }
  }

  const width = findSpec(product, ["width"]);
  if (width) {
    facts.push({ Icon: MoveHorizontal, label: "Width", value: width });
  }

  const season = findSpec(product, ["season", "seasonality"]);
  if (season) {
    facts.push({ Icon: Sparkles, label: "Season", value: season });
  }

  return facts;
}

export function FabricDetails({
  product,
  selectedLength
}: {
  product: Product;
  selectedLength?: string;
}) {
  const facts = useQuickFacts(product, selectedLength);

  if (facts.length === 0) return null;

  return (
    <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 border-y border-charcoal/[0.08] py-5 sm:grid-cols-4 sm:gap-y-0">
      {facts.map(({ Icon, label, value }, i) => (
        <div
          key={label}
          className={cn(
            "flex flex-col gap-1.5",
            i > 0 && "sm:border-l sm:border-charcoal/[0.08] sm:pl-4"
          )}
        >
          <Icon className="h-4 w-4 text-charcoal/35" />
          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-charcoal/40">
            {label}
          </dt>
          <dd className="truncate text-[13px] font-medium text-charcoal/85">
            {value}
          </dd>
        </div>
      ))}
    </div>
  );
}
