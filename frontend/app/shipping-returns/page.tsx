import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import {
  DELIVERY_TEXT,
  EXCHANGE_SUMMARY,
  PAYMENT_SUMMARY
} from "@/lib/content/shipping";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description: `Delivery and exchange information for ${siteConfig.brandName}. Local orders typically arrive in 2–5 working days. Cash on Delivery available at checkout.`,
  alternates: {
    canonical: absoluteUrl("/shipping-returns")
  },
  openGraph: {
    title: `Shipping & Returns | ${siteConfig.brandName}`,
    description:
      "Delivery timelines, courier handling, and exchange guidance for NTM Fabrics orders in Pakistan.",
    url: absoluteUrl("/shipping-returns")
  }
};

function faqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How long does delivery take?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Local orders are typically delivered within 2–5 working days after you place an order."
        }
      },
      {
        "@type": "Question",
        name: "What payment methods are available?",
        acceptedAnswer: {
          "@type": "Answer",
          text: PAYMENT_SUMMARY
        }
      },
      {
        "@type": "Question",
        name: "Can I exchange an order?",
        acceptedAnswer: {
          "@type": "Answer",
          text: EXCHANGE_SUMMARY
        }
      }
    ]
  };
}

export default function ShippingReturnsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 lg:px-12">
      <JsonLd data={faqSchema()} />
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-1.5 text-[11px] text-charcoal/40"
      >
        <Link href="/" className="hover:text-forest transition-colors">
          Home
        </Link>
        <span aria-hidden>/</span>
        <span className="text-charcoal/70">Shipping &amp; Returns</span>
      </nav>

      <h1 className="font-serif text-display-lg text-charcoal sm:text-display-xl">
        Shipping &amp; Returns
      </h1>
      <p className="mt-3 text-[14px] text-charcoal/55">
        Clear delivery and exchange information for orders from{" "}
        {siteConfig.brandName}, based in {siteConfig.city}.
      </p>

      <section className="mt-10" aria-labelledby="delivery-heading">
        <h2
          id="delivery-heading"
          className="font-serif text-display-sm text-charcoal"
        >
          Delivery
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-charcoal/65">
          {DELIVERY_TEXT}
        </p>
      </section>

      <section className="mt-10" aria-labelledby="payment-heading">
        <h2
          id="payment-heading"
          className="font-serif text-display-sm text-charcoal"
        >
          Payment
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-charcoal/65">
          {PAYMENT_SUMMARY}
        </p>
      </section>

      <section className="mt-10" aria-labelledby="exchange-heading">
        <h2
          id="exchange-heading"
          className="font-serif text-display-sm text-charcoal"
        >
          Exchanges
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-charcoal/65">
          {EXCHANGE_SUMMARY}
        </p>
      </section>

      <section className="mt-10" aria-labelledby="contact-heading">
        <h2
          id="contact-heading"
          className="font-serif text-display-sm text-charcoal"
        >
          Need help?
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-charcoal/65">
          Contact us on WhatsApp at {siteConfig.phone}, email{" "}
          {siteConfig.email}, or use the{" "}
          <Link
            href="/contact"
            className="font-medium text-forest underline-offset-2 hover:underline"
          >
            contact form
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
