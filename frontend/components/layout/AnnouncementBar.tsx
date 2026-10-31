"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AnnouncementBar() {
  const pathname = usePathname();
  const [hidden, setHidden] = React.useState(false);

  React.useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const SHOW_ZONE = 120; // always visible near the top of the page
    const THRESHOLD = 8; // ignore tiny jitters so it never flickers

    function evaluate() {
      const currentY = window.scrollY;
      const delta = currentY - lastY;
      if (currentY <= SHOW_ZONE) {
        setHidden(false);
      } else if (Math.abs(delta) > THRESHOLD) {
        setHidden(delta > 0); // scrolling down (delta > 0) hides it
      }
      lastY = currentY;
      ticking = false;
    }

    function handleScroll() {
      if (!ticking) {
        window.requestAnimationFrame(evaluate);
        ticking = true;
      }
    }

    evaluate();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 top-0 z-[60] flex h-8 items-center justify-center overflow-hidden bg-charcoal px-4 text-center transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        hidden ? "-translate-y-full" : "translate-y-0"
      )}
    >
      <p className="truncate text-[11px] font-medium uppercase tracking-[0.12em] text-cream/70">
        Nationwide delivery · Cash on delivery available · Order on WhatsApp
      </p>
    </div>
  );
}
