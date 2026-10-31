import { FadeUp, StaggerContainer, StaggerItem } from "@/components/motion/reveal";
import { JsonLdScript } from "@/components/shared/JsonLd";
import { faqJsonLd } from "@/lib/seo";

export type FaqItem = { question: string; answer: string };

export function Faq({
  items,
  title = "Frequently Asked Questions",
  className = ""
}: {
  items: FaqItem[];
  title?: string;
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <section className={`mx-auto max-w-4xl px-5 py-20 sm:px-8 lg:px-12 ${className}`}>
      <JsonLdScript data={faqJsonLd(items)} />
      <FadeUp className="text-center">
        <h2 className="font-serif text-display-lg text-charcoal sm:text-display-xl">
          {title}
        </h2>
      </FadeUp>
      <StaggerContainer className="mt-12 space-y-8">
        {items.map((item) => (
          <StaggerItem key={item.question}>
            <h3 className="font-serif text-lg font-medium text-charcoal">
              {item.question}
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-charcoal/55">
              {item.answer}
            </p>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
