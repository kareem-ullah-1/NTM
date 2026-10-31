"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const HERO_VIDEO_SRC = "/video/hero.mp4";
const HERO_POSTER_SRC = "/images/hero-poster.jpg";

export function Hero() {
  const reduced = useReducedMotion();
  const sectionRef = React.useRef<HTMLElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = React.useState(false);
  const [videoFailed, setVideoFailed] = React.useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 60]);

  const [videoAllowed, setVideoAllowed] = React.useState(true);
  React.useEffect(() => {
    const connection = (navigator as any).connection;
    if (connection?.saveData || /^(slow-2g|2g)$/.test(connection?.effectiveType ?? "")) {
      setVideoAllowed(false);
    }
  }, []);

  const showVideo = videoAllowed && !videoFailed;

  React.useEffect(() => {
    if (!showVideo || reduced) return;
    const el = videoRef.current;
    if (!el) return;
    const playPromise = el.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
      });
    }
  }, [showVideo, reduced]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[78vh] overflow-visible bg-charcoal lg:min-h-[82vh]"
    >
      {/* Background media — clipped so parallax never shows edges */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-x-0"
          style={{ top: "-8%", bottom: "-8%", y: parallaxY }}
        >
          <motion.div
            className="absolute inset-0"
            initial={{ scale: reduced ? 1 : 1.06 }}
            animate={{ scale: 1 }}
            transition={{ duration: reduced ? 0 : 1.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {showVideo && (
              <video
                ref={videoRef}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster={HERO_POSTER_SRC}
                onCanPlay={() => setVideoReady(true)}
                onError={() => setVideoFailed(true)}
                className={[
                  "absolute inset-0 h-full w-full object-cover object-center",
                  "transition-opacity duration-[1200ms] ease-out",
                  videoReady ? "opacity-100" : "opacity-0"
                ].join(" ")}
                aria-hidden="true"
              >
                <source src={HERO_VIDEO_SRC} type="video/mp4" />
              </video>
            )}

            <Image
              src={HERO_POSTER_SRC}
              alt="Premium NTM Fabrics unstitched fabric, draped and folded"
              fill
              priority
              quality={85}
              className={[
                "object-cover object-center transition-opacity duration-[1200ms] ease-out",
                showVideo && videoReady ? "opacity-0" : "opacity-100"
              ].join(" ")}
              sizes="100vw"
            />
          </motion.div>

          <div className="absolute inset-0 bg-gradient-to-r from-charcoal/45 via-charcoal/15 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 via-charcoal/10 to-charcoal/10" />

          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
            style={{
              backgroundImage:
                "repeating-linear-gradient(115deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)"
            }}
            aria-hidden="true"
          />
        </motion.div>
      </div>
      <div className="relative z-10 mx-auto flex min-h-[78vh] max-w-[1400px] items-center px-5 py-16 sm:px-8 sm:py-20 lg:min-h-[82vh] lg:px-12 lg:py-24">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : 0.15, duration: reduced ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-3 text-overline uppercase text-sand-light">
              <span className="h-px w-8 bg-sand-light/40" aria-hidden="true" />
              Premium Unstitched Fabric
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : 0.25, duration: reduced ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-[2.75rem] font-medium leading-[1.05] tracking-[-0.015em] text-cream sm:text-display-xl lg:text-display-2xl"
            style={{ textShadow: "0 2px 24px rgba(0,0,0,0.25)" }}
          >
            Crafted for the
            <br />
            <span className="italic text-sand-light">Modern Man</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : 0.35, duration: reduced ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-md text-[15px] leading-relaxed text-cream/80"
          >
            Premium fabrics for timeless Pakistani style. Wash &amp; wear, cotton, boski, and latha — selected
            for comfort, elegance, and everyday confidence.
          </motion.p>

          <motion.div
            initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : 0.45, duration: reduced ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-9"
          >
            <Button
              asChild
              size="lg"
              className="group rounded-full bg-forest px-8 text-cream transition-all duration-300 ease-out hover:bg-forest-light hover:opacity-90 hover:scale-[1.03] hover:shadow-lg hover:shadow-forest/25 active:scale-[0.98] sm:hover:scale-[1.03]"
            >
              <Link href="/shop">
                Shop Now
                <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: reduced ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reduced ? 0 : 0.6, duration: reduced ? 0 : 0.4 }}
            className="mt-16 hidden items-center gap-10 border-t border-cream/[0.08] pt-8 lg:flex"
          >
            {[
              { value: "12+", label: "Years sourcing fabric" },
              { value: "40+", label: "Weaves & finishes" },
              { value: "48h", label: "Dispatch nationwide" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-serif text-2xl font-medium text-cream/90">{stat.value}</p>
                <p className="mt-1 text-[11px] tracking-wide text-cream/35">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
