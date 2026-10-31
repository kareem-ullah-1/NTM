import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/seo";

/** Visible FAQ content — schema must match these answers exactly. */
const FAQ_ITEMS = [
  {
    question: "What does NTM Fabrics sell?",
    answer:
      "NTM Fabrics sells premium unstitched men's fabrics from Faisalabad, Pakistan, including wash & wear, premium cotton, boski, latha, and seasonal summer and winter collections, ready to tailor into shalwar kameez and traditional wear."
  },
  {
    question: "Are the fabrics unstitched?",
    answer:
      "Yes. All products are sold as unstitched fabric lengths so you can have them tailored to your preferred fit and style."
  },
  {
    question: "Where is NTM Fabrics based?",
    answer: `NTM Fabrics is based in ${siteConfig.city}, at ${siteConfig.address}. We serve customers across Pakistan.`
  },
  {
    question: "How can I order?",
    answer:
      "Browse the shop, add fabrics to your cart, and complete checkout on the website. You can also reach us on WhatsApp for assistance with colours, lengths, and stock."
  },
  {
    question: "How do I contact NTM Fabrics?",
    answer: `Contact us by WhatsApp at ${siteConfig.phone}, email ${siteConfig.email}, or use the contact form on our Contact page. Business hours are listed on the contact page.`
  },
  {
    question: "How long does delivery take?",
    answer:
      "Local orders are typically delivered within 2–5 working days after you place an order. Courier delivery is used for shipments across Pakistan."
  },
  {
    question: "What payment methods are available?",
    answer:
      "Orders are placed with Cash on Delivery (COD) at checkout."
  }
] as const;

function faqPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    })),
    url: absoluteUrl("/")
  };
}

export function HomeFaq() {
  return (
    <section
      className="border-t border-charcoal/[0.06] bg-charcoal/[0.02]"
      aria-labelledby="home-faq-heading"
    >
      <JsonLd data={faqPageSchema()} />
      <div className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 lg:px-12">
        <div className="max-w-2xl">
          <p className="text-overline uppercase tracking-[0.14em] text-rust-dark">
            Common questions
          </p>
          <h2
            id="home-faq-heading"
            className="mt-2 font-serif text-display-md text-charcoal sm:text-display-lg"
          >
            About NTM Fabrics
          </h2>
          <p className="mt-3 text-[14px] text-charcoal/55">
            Straight answers about our unstitched fabrics, location, and how to
            order.
          </p>
        </div>

        <dl className="mt-10 grid gap-6 md:grid-cols-2">
          {FAQ_ITEMS.map((item) => (
            <div
              key={item.question}
              className="rounded-xl border border-charcoal/[0.06] bg-cream px-5 py-5"
            >
              <dt className="font-medium text-charcoal">{item.question}</dt>
              <dd className="mt-2 text-[13px] leading-relaxed text-charcoal/65">
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-8 text-[13px] text-charcoal/50">
          Need more help?{" "}
          <Link
            href="/contact"
            className="font-medium text-forest underline-offset-2 hover:underline"
          >
            Contact us
          </Link>{" "}
          or browse the{" "}
          <Link
            href="/shop"
            className="font-medium text-forest underline-offset-2 hover:underline"
          >
            full fabric shop
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
