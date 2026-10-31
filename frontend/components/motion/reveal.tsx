"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  motionDistance,
  motionDuration,
  motionEase,
  motionViewport,
} from "@/lib/motion";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

export function FadeUp({ children, className, delay = 0 }: RevealProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : motionDistance.md }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={motionViewport}
      transition={{
        duration: reduced ? 0 : motionDuration.reveal,
        delay: reduced ? 0 : delay,
        ease: motionEase.out,
      }}
    >
      {children}
    </motion.div>
  );
}

const staggerContainerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

export function StaggerContainer({ children, className }: RevealProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={reduced ? undefined : staggerContainerVariants}
      initial={reduced ? undefined : "hidden"}
      whileInView={reduced ? undefined : "show"}
      viewport={motionViewport}
    >
      {children}
    </motion.div>
  );
}

const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: motionDistance.sm },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: motionDuration.reveal, ease: motionEase.out },
  },
};

export function StaggerItem({ children, className }: RevealProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={reduced ? undefined : staggerItemVariants}
    >
      {children}
    </motion.div>
  );
}

export function SectionReveal({ children, className, delay = 0 }: RevealProps) {
  const reduced = useReducedMotion();
  return (
    <motion.section
      className={className}
      initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : motionDistance.lg }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={motionViewport}
      transition={{
        duration: reduced ? 0 : motionDuration.reveal,
        delay: reduced ? 0 : delay,
        ease: motionEase.out,
      }}
    >
      {children}
    </motion.section>
  );
}

type ParallaxImageProps = {
  children: React.ReactNode;
  className?: string;
};

/** Soft scale-in on enter — not continuous parallax */
export function ParallaxImage({ children, className }: ParallaxImageProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ scale: reduced ? 1 : 1.04 }}
      whileInView={{ scale: 1 }}
      viewport={motionViewport}
      transition={{
        duration: reduced ? 0 : 0.9,
        ease: motionEase.out,
      }}
    >
      {children}
    </motion.div>
  );
}
