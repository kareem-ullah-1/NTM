"use client";

import * as React from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue
} from "framer-motion";
import { cn } from "@/lib/utils";

type ScrollLitQuoteProps = {
  quote: string;
  /** Small line under the quote — context, not a false attribution. */
  caption?: string;
  className?: string;
};

function LitWord({
  word,
  index,
  total,
  progress,
  isLast
}: {
  word: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
  isLast: boolean;
}) {
  // Each word gets its own slice of the scroll range, with a little
  // overlap so neighbouring words cross-fade instead of stepping.
  const start = Math.max(0, index / total - 0.03);
  const end = Math.min(1, (index + 1) / total);
  const opacity = useTransform(progress, [start, end], [0.16, 1]);

  return (
    <motion.span className="inline-block" style={{ opacity }}>
      {word}
      {!isLast ? "\u00A0" : ""}
    </motion.span>
  );
}

/**
 * Apple-style scroll-lit pull-quote: the section is tall enough to pin
 * a centered quote while the user scrolls, lighting one word at a time
 * as scroll progress advances. Collapses to a fully-lit, unpinned quote
 * for reduced-motion users instead of forcing them through the scrub.
 */
export function ScrollLitQuote({ quote, caption, className }: ScrollLitQuoteProps) {
  const reduced = useReducedMotion();
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const words = quote.split(" ");

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"]
  });

  const quoteClasses = cn(
    "mx-auto max-w-3xl text-balance text-center font-serif text-display-md italic leading-snug text-charcoal sm:text-display-lg",
    className
  );

  if (reduced) {
    return (
      <section aria-label="Our support promise" className="py-6">
        <div className="mx-auto mb-6 h-px w-16 bg-rust-dark/30" aria-hidden="true" />
        <p className={quoteClasses}>{quote}</p>
        {caption ? (
          <p className="mt-6 text-center text-overline uppercase text-charcoal/40">
            {caption}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      aria-label="Our support promise"
      className="relative min-h-[150vh] sm:min-h-[180vh]"
    >
      <div className="sticky top-0 flex min-h-screen flex-col items-center justify-center px-5 py-20">
        <div className="mx-auto mb-6 h-px w-16 bg-rust-dark/30" aria-hidden="true" />
        <p className={quoteClasses} aria-label={quote}>
          <span className="sr-only">{quote}</span>
          <span aria-hidden="true">
            {words.map((word, i) => (
              <LitWord
                key={`${word}-${i}`}
                word={word}
                index={i}
                total={words.length}
                progress={scrollYProgress}
                isLast={i === words.length - 1}
              />
            ))}
          </span>
        </p>
        {caption ? (
          <p className="mt-6 text-center text-overline uppercase text-charcoal/40">
            {caption}
          </p>
        ) : null}
      </div>
    </section>
  );
}
