"use client";

import { ChevronRight } from "lucide-react";
import type { Product } from "@/types/product";
import {
  CollapsibleSection,
  CareInstructionsList,
  DeliveryInfo
} from "@/components/product/ProductAccordions";

export function ProductTabs({ product }: { product: Product }) {
  function scrollToReviews() {
    document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div id="product-tabs" className="mt-10 scroll-mt-24 border-t border-charcoal/[0.08] pt-8">
      
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-display-sm text-charcoal">
          Product Information
        </h2>
        <button
          type="button"
          onClick={scrollToReviews}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-charcoal/50 transition-colors hover:text-charcoal"
        >
          Reviews
          {product.reviewCount > 0 && (
            <span className="text-charcoal/30">({product.reviewCount})</span>
          )}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-4 border-t border-charcoal/[0.06]">
        <CollapsibleSection title="Fabric & Care" defaultOpen={false}>
          <CareInstructionsList />
        </CollapsibleSection>

        <CollapsibleSection title="Shipping & Returns" defaultOpen={false}>
          
          <DeliveryInfo />
        </CollapsibleSection>
      </div>
    </div>
  );
}
