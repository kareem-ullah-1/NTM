"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import type { ApiProduct } from "@/lib/api/types";
import { siteConfig } from "@/lib/site-config";

export function ViewItemTracker({ product }: { product: ApiProduct }) {
  useEffect(() => {
    trackEvent("view_item", {
      currency: siteConfig.currency,
      value: product.price,
      items: [
        {
          item_id: product.sku,
          item_name: product.name,
          item_category: product.category,
          price: product.price
        }
      ]
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  return null;
}
