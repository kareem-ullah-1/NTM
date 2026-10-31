/**
 * Shared motion tokens for NTM Fabrics.
 * Keep animations subtle, GPU-friendly (opacity + transform), and reduced-motion aware.
 */

export const motionEase = {
  /** Soft ease-out for reveals and entrances */
  out: [0.16, 1, 0.3, 1] as const,
  /** Standard ease-out */
  easeOut: "easeOut" as const,
  /** Gentle in-out for toggles */
  inOut: [0.4, 0, 0.2, 1] as const,
};

export const motionDuration = {
  /** Micro-interactions: buttons, icons, toggles */
  micro: 0.18,
  /** UI feedback: toasts, dropdowns, hover settles */
  fast: 0.25,
  /** Section / content reveals */
  reveal: 0.4,
  /** Larger page / drawer transitions */
  slow: 0.35,
};

/** Reveal travel distance in px — keep small (8–20) */
export const motionDistance = {
  sm: 10,
  md: 16,
  lg: 20,
};

/** Shared whileInView viewport config — once only, modest threshold */
export const motionViewport = {
  once: true,
  amount: 0.15,
} as const;

/** Default fade-up initial/animate for use with useReducedMotion */
export function fadeUpState(reduced: boolean | null, distance = motionDistance.md) {
  return {
    initial: { opacity: reduced ? 1 : 0, y: reduced ? 0 : distance },
    animate: { opacity: 1, y: 0 },
  };
}

/** Drawer / overlay transitions */
export const drawerTransition = {
  duration: motionDuration.slow,
  ease: motionEase.inOut,
};

export const overlayTransition = {
  duration: motionDuration.fast,
  ease: motionEase.easeOut,
};
