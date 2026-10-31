"use client";

import { motion, useReducedMotion } from "framer-motion";

type WordLitEyebrowProps = {
  text: string;
  className?: string;
};

/**
 * Small-caps label whose words dim-in one at a time as it enters view —
 * a lighter, one-shot cousin of the scroll-linked word lighting used for
 * the pull-quote below. Not scroll-scrubbed on purpose: it's a label,
 * not a scene.
 */
export function WordLitEyebrow({ text, className }: WordLitEyebrowProps) {
  const reduced = useReducedMotion();
  const words = text.split(" ");

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            className="inline-block"
            initial={{ opacity: reduced ? 1 : 0.18 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.9 }}
            transition={{
              duration: reduced ? 0 : 0.3,
              delay: reduced ? 0 : i * 0.11,
              ease: "easeOut"
            }}
          >
            {word}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        ))}
      </span>
    </span>
  );
}
