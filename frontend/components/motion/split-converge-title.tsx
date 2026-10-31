"use client";

import { motion, useReducedMotion } from "framer-motion";
import { motionEase } from "@/lib/motion";

type SplitConvergeTitleProps = {
  /** Full heading text — split roughly in half by word count. */
  text: string;
  className?: string;
  as?: "h1" | "h2";
  /** Extra delay (s) before the converge animation starts. */
  delay?: number;
};

/**
 * Wordmark entrance: the first half of the words fly in from the left,
 * the second half from the right, converging into the full title once
 * it scrolls into view. Falls back to a plain fade for single-word
 * titles or reduced-motion users.
 */
export function SplitConvergeTitle({
  text,
  className,
  as = "h1",
  delay = 0
}: SplitConvergeTitleProps) {
  const reduced = useReducedMotion();
  const words = text.split(" ");
  const Tag = as;

  if (words.length < 2) {
    return (
      <Tag className={className}>
        <motion.span
          className="inline-block"
          initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: reduced ? 0 : 0.7, ease: motionEase.out, delay }}
        >
          {text}
        </motion.span>
      </Tag>
    );
  }

  const midpoint = Math.ceil(words.length / 2);

  return (
    <Tag className={className}>
      <span className="sr-only">{text}</span>
      <span
        aria-hidden="true"
        className="flex flex-wrap justify-center gap-x-[0.28em] gap-y-1"
      >
        {words.map((word, i) => {
          const fromLeft = i < midpoint;
          const order = fromLeft ? i : words.length - 1 - i;
          return (
            <motion.span
              key={`${word}-${i}`}
              className="inline-block"
              initial={
                reduced ? undefined : { x: fromLeft ? "-60vw" : "60vw", opacity: 0 }
              }
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{
                duration: reduced ? 0 : 0.9,
                ease: motionEase.out,
                delay: reduced ? 0 : delay + order * 0.06
              }}
            >
              {word}
            </motion.span>
          );
        })}
      </span>
    </Tag>
  );
}
