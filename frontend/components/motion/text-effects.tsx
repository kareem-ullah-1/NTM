"use client";

import * as React from "react";
import {
  motion,
  useReducedMotion,
  useInView,
  type Variants,
} from "framer-motion";
import { motionEase } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────
 * Split-converge wordmark
 * Letters start split (left half slides from left, right from right)
 * then converge into place. Ideal for short brand / page titles.
 * ───────────────────────────────────────────────────────────── */

type SplitConvergeWordmarkProps = {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  delay?: number;
};

export function SplitConvergeWordmark({
  text,
  className,
  as: Tag = "h1",
  delay = 0,
}: SplitConvergeWordmarkProps) {
  const reduced = useReducedMotion();
  const chars = Array.from(text);
  const mid = Math.ceil(chars.length / 2);

  const container: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduced ? 0 : 0.028,
        delayChildren: reduced ? 0 : delay,
      },
    },
  };

  const leftChar: Variants = {
    hidden: reduced
      ? { opacity: 1, x: 0 }
      : { opacity: 0, x: -28 },
    show: {
      opacity: 1,
      x: 0,
      transition: {
        duration: reduced ? 0 : 0.55,
        ease: motionEase.out,
      },
    },
  };

  const rightChar: Variants = {
    hidden: reduced
      ? { opacity: 1, x: 0 }
      : { opacity: 0, x: 28 },
    show: {
      opacity: 1,
      x: 0,
      transition: {
        duration: reduced ? 0 : 0.55,
        ease: motionEase.out,
      },
    },
  };

  return (
    <Tag className={cn("inline-block overflow-hidden", className)} aria-label={text}>
      <motion.span
        className="inline-flex"
        variants={container}
        initial="hidden"
        animate="show"
        aria-hidden="true"
      >
        {chars.map((char, i) => {
          const isLeft = i < mid;
          return (
            <motion.span
              key={`${char}-${i}`}
              variants={isLeft ? leftChar : rightChar}
              className="inline-block"
              style={{ whiteSpace: char === " " ? "pre" : undefined }}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          );
        })}
      </motion.span>
    </Tag>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Word-by-word lighting (entrance)
 * Each word fades + lifts in sequence. Used for eyebrows / overlines.
 * ───────────────────────────────────────────────────────────── */

type WordByWordLightingProps = {
  text: string;
  className?: string;
  as?: "span" | "p" | "h2" | "h3";
  delay?: number;
  /** Stagger between words in seconds */
  stagger?: number;
};

export function WordByWordLighting({
  text,
  className,
  as: Tag = "span",
  delay = 0,
  stagger = 0.08,
}: WordByWordLightingProps) {
  const reduced = useReducedMotion();
  const words = text.split(" ");

  const container: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduced ? 0 : stagger,
        delayChildren: reduced ? 0 : delay,
      },
    },
  };

  const word: Variants = {
    hidden: reduced
      ? { opacity: 1, y: 0, filter: "brightness(1)" }
      : { opacity: 0.15, y: 6, filter: "brightness(0.55)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "brightness(1)",
      transition: {
        duration: reduced ? 0 : 0.45,
        ease: motionEase.out,
      },
    },
  };

  return (
    <Tag className={cn("inline-block", className)} aria-label={text}>
      <motion.span
        className="inline"
        variants={container}
        initial="hidden"
        animate="show"
        aria-hidden="true"
      >
        {words.map((w, i) => (
          <motion.span
            key={`${w}-${i}`}
            variants={word}
            className="inline-block"
            style={{ marginRight: i < words.length - 1 ? "0.3em" : undefined }}
          >
            {w}
          </motion.span>
        ))}
      </motion.span>
    </Tag>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Scroll-triggered word-by-word lighting (pull-quote style)
 * Words start dimmed and “light up” as the block enters view.
 * ───────────────────────────────────────────────────────────── */

type PullQuoteWordLightingProps = {
  text: string;
  className?: string;
  attribution?: string;
  delay?: number;
  stagger?: number;
};

export function PullQuoteWordLighting({
  text,
  className,
  attribution,
  delay = 0,
  stagger = 0.055,
}: PullQuoteWordLightingProps) {
  const reduced = useReducedMotion();
  const ref = React.useRef<HTMLQuoteElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const words = text.split(" ");

  const container: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduced ? 0 : stagger,
        delayChildren: reduced ? 0 : delay,
      },
    },
  };

  const word: Variants = {
    hidden: reduced
      ? { opacity: 1, filter: "brightness(1)" }
      : { opacity: 0.22, filter: "brightness(0.45)" },
    show: {
      opacity: 1,
      filter: "brightness(1)",
      transition: {
        duration: reduced ? 0 : 0.5,
        ease: motionEase.out,
      },
    },
  };

  return (
    <blockquote
      ref={ref}
      className={cn("relative", className)}
      aria-label={text}
    >
      <motion.span
        className="inline"
        variants={container}
        initial="hidden"
        animate={inView || reduced ? "show" : "hidden"}
        aria-hidden="true"
      >
        {words.map((w, i) => (
          <motion.span
            key={`${w}-${i}`}
            variants={word}
            className="inline-block"
            style={{ marginRight: i < words.length - 1 ? "0.28em" : undefined }}
          >
            {w}
          </motion.span>
        ))}
      </motion.span>
      {attribution && (
        <motion.footer
          className="mt-6 text-[13px] tracking-wide text-charcoal/40"
          initial={{ opacity: reduced ? 1 : 0 }}
          animate={{ opacity: inView || reduced ? 1 : 0 }}
          transition={{
            delay: reduced ? 0 : delay + words.length * stagger + 0.15,
            duration: 0.4,
            ease: motionEase.out,
          }}
        >
          — {attribution}
        </motion.footer>
      )}
    </blockquote>
  );
}
