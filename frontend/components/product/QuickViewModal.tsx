"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, ShoppingBag } from "lucide-react";
import type { Product } from "@/types/product";
import { formatPrice, cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/shared/RatingStars";
import { useCartStore } from "@/store/use-cart-store";
import { useToastStore } from "@/store/use-toast-store";

export function QuickViewModal({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const showToast = useToastStore((state) => state.showToast);

  const [selectedColor, setSelectedColor] = React.useState(
    product.colors[0]?.name ?? ""
  );

  const selectedColorObj = React.useMemo(() => {
    return product.colors.find(
      (c) => c.name.toLowerCase() === selectedColor.toLowerCase()
    );
  }, [product.colors, selectedColor]);

  const activeImage = React.useMemo(() => {
    if (selectedColorObj?.images && selectedColorObj.images.length > 0) {
      return selectedColorObj.images[0];
    }
    if (selectedColorObj?.image) {
      return selectedColorObj.image;
    }
    return product.images[0] || "";
  }, [selectedColorObj, product.images]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          aria-label={`Quick view ${product.name}`}
          className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/80 text-charcoal/60 shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-110 lg:opacity-0 lg:group-hover:opacity-100"
        >
          <Eye className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">
            {product.name}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[8px] bg-charcoal/[0.03]">
            {activeImage && (
              <Image
                src={activeImage}
                alt={product.name}
                fill
                sizes="300px"
                className="object-cover transition-opacity duration-300"
              />
            )}
          </div>
          <div>
            <RatingStars
              rating={product.rating}
              reviewCount={product.reviewCount}
            />
            <p className="mt-3 text-xl font-medium text-charcoal">
              {formatPrice(product.price)}
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-charcoal/60 line-clamp-3">
              {product.description}
            </p>

            {}
            {product.colors.length > 0 && (
              <div className="mt-4">
                <p className="mb-1.5 text-xs text-charcoal/50">
                  Colour: <span className="font-medium text-charcoal">{selectedColor}</span>
                </p>
                <div className="flex gap-1.5">
                  {product.colors.map((option) => (
                    <button
                      key={option.name}
                      onClick={() => setSelectedColor(option.name)}
                      aria-label={option.name}
                      className={cn(
                        "h-7 w-7 rounded-full border-2 transition-all",
                        selectedColor === option.name
                          ? "border-forest scale-110"
                          : "border-transparent"
                      )}
                      style={{ backgroundColor: option.hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-2">
              <Button
                onClick={() => {
                  addItem({
                    productId: product.id,
                    slug: product.slug,
                    name: product.name,
                    image: activeImage,
                    selectedColor: selectedColor || product.colors[0]?.name || "Default",
                    selectedLength: product.availableLengths[0] ?? "4 meters",
                    quantity: 1,
                    unitPrice: product.price
                  });
                  showToast(`${product.name} added to cart`);
                }}
                className="rounded-full"
              >
                <ShoppingBag className="h-4 w-4" />
                Add to Cart
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full"
              >
                <Link href={`/shop/${product.slug}`}>
                  View Details
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
