import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight, ShieldCheck, Truck, RefreshCw, Award } from "lucide-react";
import {
  fetchProductBySlug,
  fetchRelatedProducts
} from "@/lib/api/products";
import { ApiRequestError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo";
import { JsonLdScript } from "@/components/shared/JsonLd";
import { ProductDetailsView } from "@/components/product/ProductDetailsView";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { ProductReviews } from "@/components/product/ProductReviews";
import { ViewItemTracker } from "@/components/product/ViewItemTracker";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const product = await fetchProductBySlug(params.slug);
    const description = product.description?.trim()
      ? product.description.slice(0, 160)
      : `${product.name} — unstitched ${product.fabricType} fabric from ${siteConfig.brandName}, priced at ${siteConfig.currency} ${product.price}.`;
    const image = product.images[0];

    return {
      title: product.name,
      description,
      keywords: [
        product.name,
        `${product.fabricType} fabric`,
        `unstitched ${product.fabricType}`,
        "men's fabric",
        "buy fabric online Pakistan",
        siteConfig.brandName,
        "unstitched fabric Pakistan"
      ],
      alternates: { canonical: `/shop/${product.slug}` },
      openGraph: {
        title: product.name,
        description,
        type: "website",
        url: `/shop/${product.slug}`,
        images: image ? [{ url: image }] : undefined
      },
      twitter: {
        card: "summary_large_image",
        title: product.name,
        description,
        images: image ? [image] : undefined
      }
    };
  } catch {
    return { title: "Product Not Found" };
  }
}

const TRUST_ITEMS = [
  { icon: Truck, label: "Fast Delivery", subtitle: "Across Pakistan" },
  { icon: ShieldCheck, label: "Secure Checkout", subtitle: "Your data is safe with us" },
  { icon: RefreshCw, label: "Easy Exchange", subtitle: "Hassle free process" },
  { icon: Award, label: "Premium Quality", subtitle: "Finest fabrics, lasting comfort" }
] as const;

export default async function ProductPage({
  params
}: {
  params: { slug: string };
}) {
  let product;
  try {
    product = await fetchProductBySlug(params.slug);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) notFound();
    throw error;
  }

  const related = await fetchRelatedProducts(params.slug).catch(() => []);

  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    { name: product.category, path: `/shop?category=${encodeURIComponent(product.category)}` },
    { name: product.name, path: `/shop/${product.slug}` }
  ];

  return (
    <div>
      <JsonLdScript data={productJsonLd(product)} />
      <JsonLdScript data={breadcrumbJsonLd(breadcrumbItems)} />
      <ViewItemTracker product={product} />

      {/* Breadcrumbs */}
      <div className="border-b border-charcoal/[0.04]">
        <nav
          aria-label="Breadcrumb"
          className="mx-auto flex max-w-[1400px] items-center gap-1 px-5 py-3 text-[11px] tracking-wide text-charcoal/35 sm:px-8 lg:px-12"
        >
          <Link href="/" className="transition-colors hover:text-charcoal/70">
            Home
          </Link>
          <ChevronRight className="h-2.5 w-2.5 text-charcoal/20" />
          <Link
            href="/shop"
            className="transition-colors hover:text-charcoal/70"
          >
            Shop
          </Link>
          <ChevronRight className="h-2.5 w-2.5 text-charcoal/20" />
          <Link
            href={`/shop?category=${encodeURIComponent(product.category)}`}
            className="transition-colors hover:text-charcoal/70"
          >
            {product.category}
          </Link>
          <ChevronRight className="h-2.5 w-2.5 text-charcoal/20" />
          <span className="max-w-[180px] truncate text-charcoal/60">
            {product.name}
          </span>
        </nav>
      </div>

      {/* Product Details */}
      <div className="mx-auto max-w-[1400px] px-5 pt-8 sm:px-8 lg:px-12">
        <ProductDetailsView product={product} />
      </div>

      {/* Trust / Reassurance Strip */}
      <div className="border-y border-charcoal/[0.06] bg-charcoal/[0.015]">
        <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-y-5 px-5 py-6 sm:grid-cols-4 sm:gap-y-0 sm:px-8 lg:px-12">
          {TRUST_ITEMS.map((item, i) => (
            <div
              key={item.label}
              className={cn(
                "flex items-center gap-3 px-2",
                i > 0 && "sm:border-l sm:border-charcoal/[0.07] sm:pl-5"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0 text-forest" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-charcoal">
                  {item.label}
                </p>
                <p className="truncate text-[11px] text-charcoal/45">
                  {item.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <ProductReviews
        slug={product.slug}
        initialRating={product.rating}
        initialReviewCount={product.reviewCount}
      />

      {/* Related Products */}
      {related.length > 0 && (
        <RelatedProducts products={related} title="You May Also Like" />
      )}
    </div>
  );
}
