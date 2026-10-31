"use client";

import * as React from "react";
import type { Product } from "@/types/product";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";
import { ProductTabs } from "@/components/product/ProductTabs";

type ProductDetailsViewProps = {
  product: Product;
};

export function ProductDetailsView({ product }: ProductDetailsViewProps) {
  const initialColor = product.colors[0]?.name ?? "";
  const [selectedColor, setSelectedColor] = React.useState(initialColor);

  const selectedColorObj = React.useMemo(() => {
    return product.colors.find(
      (c) => c.name.toLowerCase() === selectedColor.toLowerCase()
    );
  }, [product.colors, selectedColor]);

  const activeImages = React.useMemo(() => {
    if (!selectedColorObj) return product.images;

    if (selectedColorObj.images && selectedColorObj.images.length > 0) {
      return selectedColorObj.images;
    }
    if (selectedColorObj.image) {
      return [selectedColorObj.image];
    }

    return product.images;
  }, [selectedColorObj, product.images]);

  const badgeLabel =
    product.stock === 0
      ? "Sold Out"
      : product.isNew
        ? "New Arrival"
        : undefined;

  return (
    <div className="pb-16 lg:pb-24">
      <div className="grid gap-10 pb-4 lg:grid-cols-[1fr_1fr] lg:items-start lg:gap-16">
        <ProductGallery
          images={activeImages}
          name={product.name}
          selectedColor={selectedColor}
          badgeLabel={badgeLabel}
        />
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductInfo
            product={product}
            selectedColor={selectedColor}
            onColorChange={setSelectedColor}
            activeImage={activeImages[0] || product.images[0]}
          />
          <ProductTabs product={product} />
        </div>
      </div>
    </div>
  );
}
