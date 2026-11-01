import { siteConfig } from "@/lib/site-config";
import type { ApiProduct } from "@/lib/api/types";

export function absoluteUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.siteUrl}${normalized}`;
}

export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.brandName,
    url: siteConfig.siteUrl,
    logo: absoluteUrl("/icon"),
    description: siteConfig.brandTagline,
    email: siteConfig.email,
    telephone: siteConfig.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address,
      addressLocality: "Faisalabad",
      addressRegion: "Punjab",
      addressCountry: "PK"
    },
    sameAs: Object.values(siteConfig.social)
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.brandName,
    url: siteConfig.siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/shop")}?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

export function localBusinessJsonLd() {
  const openingHours = siteConfig.businessHours
    .filter((entry) => entry.hours.toUpperCase() !== "CLOSED")
    .map((entry) => `${entry.day} ${entry.hours}`);

  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: siteConfig.brandName,
    url: siteConfig.siteUrl,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address,
      addressLocality: "Faisalabad",
      addressRegion: "Punjab",
      addressCountry: "PK"
    },
    openingHoursSpecification: openingHours,
    sameAs: Object.values(siteConfig.social)
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path)
    }))
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}

export function productJsonLd(product: ApiProduct) {
  const availability =
    product.status === "Out of Stock"
      ? "https://schema.org/OutOfStock"
      : "https://schema.org/InStock";

  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    image: product.images,
    category: product.category,
    brand: {
      "@type": "Brand",
      name: siteConfig.brandName
    },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/shop/${product.slug}`),
      priceCurrency: siteConfig.currency,
      price: product.price,
      availability,
      itemCondition: "https://schema.org/NewCondition"
    }
  };

  if (product.reviewCount > 0) {
    base.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount
    };
  }

  return base;
}
