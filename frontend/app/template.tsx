"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { motionDuration, motionEase, motionDistance } from "@/lib/motion";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin || reduced) {
    return <>{children}</>;
  }

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: motionDistance.sm }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: motionDuration.slow, ease: motionEase.out }}
    >
      {children}
    </motion.div>
  );
}
