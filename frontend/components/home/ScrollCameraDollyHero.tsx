"use client";

import * as React from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type ScrollCameraDollyHeroProps = {
  /** Front face of the object being dollied toward / rotated */
  frontImageSrc: string;
  /** Optional back face — falls back to frontImageSrc (mirrored look) if omitted */
  backImageSrc?: string;
  alt: string;
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  /** How long the section stays pinned, in viewport heights driving the scrub, e.g. "250%" */
  pinDistance?: string;
  /** Total Y-axis rotation swept across the full pin, in degrees */
  rotationDegrees?: number;
};

/**
 * Pinned hero: the section locks in place while the "camera" (rig) dollies
 * forward on the Z-axis and the object spins on its Y-axis — both driven
 * 1:1 by scroll position via ScrollTrigger's `scrub`. Nothing here plays on
 * a timer; scrub the page and the motion stops exactly where you stop.
 */
export function ScrollCameraDollyHero({
  frontImageSrc,
  backImageSrc,
  alt,
  eyebrow,
  title,
  subtitle,
  pinDistance = "250%",
  rotationDegrees = 320,
}: ScrollCameraDollyHeroProps) {
  const sceneRef = React.useRef<HTMLElement>(null);
  const rigRef = React.useRef<HTMLDivElement>(null);
  const objectRef = React.useRef<HTMLDivElement>(null);
  const bgRef = React.useRef<HTMLDivElement>(null);
  const copyRef = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          reduced: "(prefers-reduced-motion: reduce)",
          full: "(prefers-reduced-motion: no-preference)",
        },
        (context) => {
          const { reduced } = context.conditions as { reduced: boolean };

          if (reduced) {
            // Settle at the "arrived" end-state — no pin, no scrub, no motion.
            gsap.set(rigRef.current, { z: 0, scale: 1 });
            gsap.set(objectRef.current, { rotateY: rotationDegrees * 0.35 });
            gsap.set(bgRef.current, { scale: 1, filter: "blur(0px)", opacity: 1 });
            gsap.set(copyRef.current, { opacity: 1, y: 0 });
            return;
          }

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: sceneRef.current,
              start: "top top",
              end: `+=${pinDistance}`,
              pin: true,
              scrub: 1, // tied to scroll position only — never autoplays
              anticipatePin: 1,
            },
          });

          // Camera dolly-in: the rig pulls forward from far back to resting depth
          tl.fromTo(
            rigRef.current,
            { z: -900, scale: 0.55 },
            { z: 0, scale: 1, duration: 0.7, ease: "none" },
            0
          )
            // Object rotates continuously across the whole scrub range
            .fromTo(
              objectRef.current,
              { rotateY: -rotationDegrees / 2 },
              { rotateY: rotationDegrees / 2, duration: 1, ease: "none" },
              0
            )
            // Background sharpens/settles as the camera arrives (depth-0 layer)
            .fromTo(
              bgRef.current,
              { scale: 1.15, filter: "blur(6px)", opacity: 0.5 },
              { scale: 1, filter: "blur(0px)", opacity: 1, duration: 0.7, ease: "none" },
              0
            )
            // Copy arrives once the camera has mostly landed
            .fromTo(
              copyRef.current,
              { opacity: 0, y: 40 },
              { opacity: 1, y: 0, duration: 0.3, ease: "none" },
              0.62
            );
        }
      );

      return () => mm.revert();
    },
    { scope: sceneRef }
  );

  return (
    <section
      ref={sceneRef}
      className="relative h-[100svh] overflow-hidden bg-charcoal"
      style={{ perspective: "1400px" }}
    >
      {/* depth-0 — far background, blurred until the camera lands */}
      <div
        ref={bgRef}
        aria-hidden="true"
        className="absolute inset-0"
        style={{ willChange: "transform, filter, opacity" }}
      >
        <Image
          src={frontImageSrc}
          alt=""
          fill
          priority
          sizes="100vw"
          className="scale-110 object-cover object-center opacity-40"
        />
        <div className="absolute inset-0 bg-charcoal/70" />
      </div>

      {/* camera rig — everything that moves with the "camera" lives here */}
      <div
        ref={rigRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{ transformStyle: "preserve-3d", willChange: "transform" }}
      >
        {/* depth-3 — the rotating object, built from two faces so it never
            shows a blank edge past 90deg of rotation */}
        <div
          ref={objectRef}
          className="relative aspect-[3/4] w-[60vw] max-w-[420px]"
          style={{ transformStyle: "preserve-3d", willChange: "transform" }}
        >
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl shadow-2xl shadow-black/50"
            style={{ backfaceVisibility: "hidden" }}
          >
            <Image src={frontImageSrc} alt={alt} fill sizes="60vw" className="object-cover" />
          </div>
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl shadow-2xl shadow-black/50"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <Image
              src={backImageSrc ?? frontImageSrc}
              alt=""
              fill
              sizes="60vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* depth-4 — copy, arrives once the camera has landed */}
      <div
        ref={copyRef}
        className="pointer-events-none absolute inset-x-0 bottom-16 z-10 mx-auto max-w-2xl px-6 text-center"
      >
        {eyebrow && (
          <span className="text-overline uppercase tracking-[0.2em] text-sand-light">
            {eyebrow}
          </span>
        )}
        <h2 className="mt-3 font-serif text-3xl font-medium text-cream sm:text-4xl">{title}</h2>
        {subtitle && <p className="mt-3 text-sm text-cream/70">{subtitle}</p>}
      </div>
    </section>
  );
}
