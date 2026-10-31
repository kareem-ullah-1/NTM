import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import { fetchFilterOptions } from "@/lib/api/products";
import { faqJsonLd } from "@/lib/seo";
import { JsonLdScript } from "@/components/shared/JsonLd";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from "@/components/ui/accordion";
import { FadeUp } from "@/components/motion/reveal";
import {
  SplitConvergeWordmark,
  WordByWordLighting,
  PullQuoteWordLighting,
} from "@/components/motion/text-effects";

export const metadata: Metadata = {
  title: "Help Center",
  description:
    "Find answers to common questions about NTM Fabrics, shopping, delivery and orders.",
  keywords: [
    "help center",
    "fabric shopping FAQ",
    "delivery FAQ Pakistan",
    "order help NTM Fabrics",
    "fabric returns and exchange",
    "shipping information Pakistan",
    "NTM Fabrics support"
  ],
  alternates: { canonical: "/help" }
};

type HelpCategory = {
  id: string;
  label: string;
  questions: { question: string; answer: React.ReactNode; answerText: string }[];
};

async function getCategories(): Promise<HelpCategory[]> {
  const categoryNames = await fetchFilterOptions()
    .then((res) => res.categories.map((c) => c.value))
    .catch(() => []);

  const fabricCategoryAnswer =
    categoryNames.length > 0
      ? `NTM Fabrics currently carries ${categoryNames.join(", ")} — all premium unstitched men's fabric.`
      : "NTM Fabrics carries a range of premium unstitched men's fabric. Browse the Shop page to see current categories.";

  return [
    {
      id: "delivery",
      label: "Delivery",
      questions: [
        {
          question: "Does NTM Fabrics deliver across Pakistan?",
          answerText:
            "Yes. Orders are dispatched within 48 hours and delivered by courier anywhere in Pakistan.",
          answer:
            "Yes. Orders are dispatched within 48 hours and delivered by courier anywhere in Pakistan."
        },
        {
          question: "How long does delivery take?",
          answerText:
            "Local orders typically arrive within 2–5 working days of dispatch. A signature may be required, and the courier will make up to two more delivery attempts if no one is available.",
          answer:
            "Local orders typically arrive within 2–5 working days of dispatch. A signature may be required, and the courier will make up to two more delivery attempts if no one is available."
        },
        {
          question: "How can I check my order?",
          answerText:
            "Your order number is shown on the confirmation screen right after checkout. For a status update, message us on WhatsApp with your order number.",
          answer:
            "Your order number is shown on the confirmation screen right after checkout. For a status update, message us on WhatsApp with your order number."
        },
        {
          question: "Can I change my delivery address after ordering?",
          answerText:
            "We're unable to change a delivery address once an order has been dispatched, so please contact us as soon as possible after placing your order if it needs to be updated.",
          answer:
            "We're unable to change a delivery address once an order has been dispatched, so please contact us as soon as possible after placing your order if it needs to be updated."
        }
      ]
    },
    {
      id: "faqs",
      label: "FAQs",
      questions: [
        {
          question: "What type of fabric does NTM Fabrics sell?",
          answerText:
            "Premium unstitched men's fabric, sold as a length of material rather than a finished, stitched garment.",
          answer:
            "Premium unstitched men's fabric, sold as a length of material rather than a finished, stitched garment."
        },
        {
          question: "What fabric categories are available?",
          answerText: fabricCategoryAnswer,
          answer: fabricCategoryAnswer
        },
        {
          question: "How can I choose the right fabric?",
          answerText:
            "Use the filters on the Shop page to browse by category, color and price, and check each product page for its fabric type and details.",
          answer: (
            <>
              Use the filters on the{" "}
              <Link href="/shop" className="text-forest underline underline-offset-2">
                Shop page
              </Link>{" "}
              to browse by category, color and price, and check each product page for its fabric type and details.
            </>
          )
        },
        {
          question: "What is wash and wear fabric?",
          answerText:
            "Wash and wear is a cotton-polyester blend finished to resist wrinkling and hold its shape after washing.",
          answer:
            "Wash and wear is a cotton-polyester blend finished to resist wrinkling and hold its shape after washing."
        },
        {
          question: "What is Boski fabric?",
          answerText:
            "Boski is a fine, lightly lustrous fabric traditionally blended with silk, often chosen for a smarter, more formal look.",
          answer:
            "Boski is a fine, lightly lustrous fabric traditionally blended with silk, often chosen for a smarter, more formal look."
        }
      ]
    },
    {
      id: "online-shopping",
      label: "Online Shopping",
      questions: [
        {
          question: "How do I add a product to my cart?",
          answerText:
            "Open any product page, choose a color and length, then press Add to Cart.",
          answer: "Open any product page, choose a color and length, then press Add to Cart."
        },
        {
          question: "Can I buy directly from a product page?",
          answerText:
            "Yes — add the item to your cart from the product page, then go straight to checkout.",
          answer:
            "Yes — add the item to your cart from the product page, then go straight to checkout."
        },
        {
          question: "How do I place an order?",
          answerText:
            "Add items to your cart, go to checkout, fill in your delivery details, and confirm your order with Cash on Delivery.",
          answer: (
            <>
              Add items to your cart, go to{" "}
              <Link href="/cart" className="text-forest underline underline-offset-2">
                checkout
              </Link>
              , fill in your delivery details, and confirm your order with Cash on Delivery.
            </>
          )
        }
      ]
    },
    {
      id: "payment",
      label: "Payment",
      questions: [
        {
          question: "What payment methods are available?",
          answerText: "Cash on Delivery is currently the only payment method NTM Fabrics accepts.",
          answer: "Cash on Delivery is currently the only payment method NTM Fabrics accepts."
        },
        {
          question: "Is Cash on Delivery available on all orders?",
          answerText: "Yes, Cash on Delivery is available on every order placed on the website.",
          answer: "Yes, Cash on Delivery is available on every order placed on the website."
        }
      ]
    },
    {
      id: "customer-account",
      label: "Customer Account",
      questions: [
        {
          question: "Do I need an account to order?",
          answerText:
            "No. Checkout on NTM Fabrics is guest-only, so you don't need to create an account or sign in to place an order.",
          answer:
            "No. Checkout on NTM Fabrics is guest-only, so you don't need to create an account or sign in to place an order."
        },
        {
          question: "Can I create a customer account?",
          answerText:
            "Customer accounts aren't available yet. You can place orders directly as a guest.",
          answer: "Customer accounts aren't available yet. You can place orders directly as a guest."
        }
      ]
    },
    {
      id: "returns-exchanges",
      label: "Returns & Exchanges",
      questions: [
        {
          question: "What is the exchange policy?",
          answerText:
            "NTM Fabrics offers an easy exchange process. Message us on WhatsApp with your order number and our team will guide you through the next steps.",
          answer: (
            <>
              NTM Fabrics offers an easy exchange process. Message us on{" "}
              <a
                href={`https://wa.me/${siteConfig.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-forest underline underline-offset-2"
              >
                WhatsApp
              </a>{" "}
              with your order number and our team will guide you through the next steps.
            </>
          )
        },
        {
          question: "Can I get a refund?",
          answerText:
            "As all orders are Cash on Delivery, refund and exchange requests are handled directly with our support team on WhatsApp.",
          answer:
            "As all orders are Cash on Delivery, refund and exchange requests are handled directly with our support team on WhatsApp."
        }
      ]
    }
  ];
}

export default async function HelpPage() {
  const categories = await getCategories();
  const faqItems = categories.flatMap((category) =>
    category.questions.map((q) => ({ question: q.question, answer: q.answerText }))
  );

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-12">
      <JsonLdScript data={faqJsonLd(faqItems)} />

      {/* ── Hero: split-converge wordmark + word-by-word eyebrow ── */}
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-5">
          <WordByWordLighting
            text="Answers · Support · Guidance"
            className="text-overline uppercase tracking-[0.18em] text-charcoal/40"
            delay={0.05}
            stagger={0.09}
          />
        </div>

        <SplitConvergeWordmark
          text="Help"
          className="font-serif text-display-xl text-charcoal sm:text-display-2xl"
          delay={0.12}
        />

        <FadeUp delay={0.35} className="mt-4">
          <p className="mx-auto max-w-lg text-[14px] leading-relaxed text-charcoal/55">
            Find answers to common questions about NTM Fabrics, shopping, delivery and orders.
          </p>
        </FadeUp>
      </div>

      {/* ── Pull-quote section: word-by-word lighting on scroll ── */}
      <section className="mx-auto mt-20 max-w-3xl px-2 text-center sm:mt-24">
        <PullQuoteWordLighting
          text="Good fabric is the quiet foundation of every well-made shalwar kameez — we are here to help you choose it with confidence."
          className="font-serif text-[1.35rem] leading-snug tracking-tight text-charcoal sm:text-[1.6rem] sm:leading-[1.35]"
          attribution="NTM Fabrics"
          delay={0.05}
          stagger={0.048}
        />
      </section>

      <div className="mt-16 grid gap-10 lg:mt-20 lg:grid-cols-[220px_1fr] lg:gap-16">
        <aside className="hidden lg:block">
          <nav aria-label="Help categories" className="sticky top-28 space-y-1">
            {categories.map((category) => (
              <a
                key={category.id}
                href={`#${category.id}`}
                className="block rounded-md px-3 py-2 text-[13px] text-charcoal/55 transition-colors hover:bg-charcoal/[0.04] hover:text-charcoal"
              >
                {category.label}
              </a>
            ))}
            <a
              href="#contact-us"
              className="block rounded-md px-3 py-2 text-[13px] text-charcoal/55 transition-colors hover:bg-charcoal/[0.04] hover:text-charcoal"
            >
              Contact Us
            </a>
          </nav>
        </aside>

        <div className="min-w-0 space-y-16">
          {categories.map((category) => (
            <section key={category.id} id={category.id} className="scroll-mt-28">
              <h2 className="font-serif text-display-md text-charcoal sm:text-display-lg">
                {category.label}
              </h2>
              <Accordion type="single" collapsible className="mt-6">
                {category.questions.map((item, index) => (
                  <AccordionItem key={item.question} value={`${category.id}-${index}`}>
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent>{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}

          <section id="contact-us" className="scroll-mt-28">
            <h2 className="font-serif text-display-md text-charcoal sm:text-display-lg">
              Contact Us
            </h2>
            <p className="mt-5 max-w-xl text-[14px] leading-relaxed text-charcoal/55">
              WhatsApp is the fastest way to reach us at {siteConfig.phone}. You can also
              email{" "}
              <a href={`mailto:${siteConfig.email}`} className="text-forest underline underline-offset-2">
                {siteConfig.email}
              </a>
              , or visit our{" "}
              <Link href="/contact" className="text-forest underline underline-offset-2">
                Contact page
              </Link>{" "}
              for the store address and business hours.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
