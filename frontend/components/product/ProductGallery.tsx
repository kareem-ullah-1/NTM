"use client";

import * as React from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Layers,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ProductGalleryProps = {
  images: string[];
  name: string;
  selectedColor?: string;
  badgeLabel?: string;
};

export function ProductGallery({
  images,
  name,
  selectedColor,
  badgeLabel,
}: ProductGalleryProps) {
  const reduced = useReducedMotion();
  const [active, setActive] = React.useState(0);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [mainLoaded, setMainLoaded] = React.useState(false);
  const [brokenImages, setBrokenImages] = React.useState<Set<string>>(
    new Set()
  );
  const [chromeVisible, setChromeVisible] = React.useState(true);
  const [imageAspect, setImageAspect] = React.useState<number | null>(null);

  const mainTouchX = React.useRef<number | null>(null);
  const lightboxTouchX = React.useRef<number | null>(null);
  const lightboxTouchY = React.useRef<number | null>(null);
  const bodyOverflowRef = React.useRef<string>("");
  const lastWheelTs = React.useRef(0);

  React.useEffect(() => {
    setActive(0);
    setMainLoaded(false);
    setImageAspect(null);
  }, [images, selectedColor]);

  React.useEffect(() => {
    if (images.length === 0) return;

    if (active >= images.length) {
      setActive(0);
      setMainLoaded(false);
      setImageAspect(null);
    }
  }, [images.length, active]);

  React.useEffect(() => {
    if (!lightboxOpen) return;

    bodyOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = bodyOverflowRef.current || "";
    };
  }, [lightboxOpen]);

  const safeActive =
    images.length > 0 ? Math.min(active, images.length - 1) : 0;

  const currentImage = images[safeActive];
  const currentImageBroken = currentImage
    ? brokenImages.has(currentImage)
    : false;

  function selectImage(index: number) {
    if (images.length === 0) return;

    const next = ((index % images.length) + images.length) % images.length;

    if (next === safeActive) return;

    setMainLoaded(false);
    setActive(next);
  }

  function openLightbox() {
    if (!currentImage || currentImageBroken) return;

    setChromeVisible(true);
    setLightboxOpen(true);
  }

  function closeLightbox() {
    setLightboxOpen(false);
  }

  function goLightbox(delta: number) {
    if (images.length <= 1) return;

    setMainLoaded(false);

    setActive((i) => {
      return (i + delta + images.length) % images.length;
    });
  }

  function onLightboxWheel(e: React.WheelEvent) {
    const now = Date.now();

    if (now - lastWheelTs.current < 50) return;

    lastWheelTs.current = now;

    if (e.deltaY > 6) {
      setChromeVisible(false);
    } else if (e.deltaY < -6) {
      setChromeVisible(true);
    }
  }

  React.useEffect(() => {
    if (!lightboxOpen) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setLightboxOpen(false);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goLightbox(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goLightbox(1);
      }
    }

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, images.length]);

  function onMainTouchStart(e: React.TouchEvent) {
    mainTouchX.current = e.touches[0]?.clientX ?? null;
  }

  function onMainTouchEnd(e: React.TouchEvent) {
    if (mainTouchX.current === null || images.length <= 1) return;

    const deltaX = e.changedTouches[0].clientX - mainTouchX.current;

    mainTouchX.current = null;

    if (Math.abs(deltaX) < 40) return;

    selectImage(safeActive + (deltaX < 0 ? 1 : -1));
  }

  function onLightboxTouchStart(e: React.TouchEvent) {
    lightboxTouchX.current = e.touches[0]?.clientX ?? null;
    lightboxTouchY.current = e.touches[0]?.clientY ?? null;
  }

  function onLightboxTouchEnd(e: React.TouchEvent) {
    const startX = lightboxTouchX.current;
    const startY = lightboxTouchY.current;

    lightboxTouchX.current = null;
    lightboxTouchY.current = null;

    if (startX === null || startY === null) return;

    const deltaX = e.changedTouches[0].clientX - startX;
    const deltaY = e.changedTouches[0].clientY - startY;

    if (
      Math.abs(deltaY) > Math.abs(deltaX) &&
      Math.abs(deltaY) > 30
    ) {
      if (deltaY < 0) {
        setChromeVisible(false);
      } else {
        setChromeVisible(true);
      }

      return;
    }

    if (images.length <= 1) return;
    if (Math.abs(deltaX) < 40) return;

    goLightbox(deltaX < 0 ? 1 : -1);
  }

  const hasMultiple = images.length > 1;

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="min-w-0">
          <div
            role="button"
            tabIndex={0}
            aria-label="View full image"
            onClick={openLightbox}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openLightbox();
              }
            }}
            onTouchStart={onMainTouchStart}
            onTouchEnd={onMainTouchEnd}
            className={cn(
              "group fabric-texture relative w-full overflow-hidden rounded-[8px] border border-charcoal/[0.06] bg-charcoal/[0.02]",
              "max-h-[760px]",
              imageAspect === null && "aspect-[4/5]",
              currentImage &&
                !currentImageBroken &&
                "cursor-zoom-in"
            )}
            style={
              imageAspect !== null
                ? { aspectRatio: imageAspect }
                : undefined
            }
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedColor ?? ""}-${safeActive}-${currentImage ?? "none"}`}
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduced ? undefined : { opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.2 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {currentImage && !currentImageBroken ? (
                  <>
                    {!mainLoaded && (
                      <div className="absolute inset-0 animate-pulse bg-charcoal/[0.06]" />
                    )}

                    <Image
                      src={currentImage}
                      alt={`${name}${
                        selectedColor ? ` - ${selectedColor}` : ""
                      } - view ${safeActive + 1}`}
                      fill
                      priority={safeActive === 0}
                      quality={85}
                      sizes="(min-width: 1024px) 640px, 92vw"
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        setMainLoaded(true);
                        if (
                          img.naturalWidth > 0 &&
                          img.naturalHeight > 0
                        ) {
                          setImageAspect(
                            img.naturalWidth / img.naturalHeight
                          );
                        }
                      }}
                      onError={() =>
                        setBrokenImages(
                          (prev) => new Set(prev).add(currentImage)
                        )
                      }
                      className={cn(
                        "object-contain transition-opacity duration-300",
                        mainLoaded ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </>
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-charcoal/5 p-6 text-center text-charcoal/30">
                    <Layers className="mb-2 h-10 w-10" />

                    <span className="text-xs">
                      {currentImageBroken
                        ? "Image failed to load"
                        : "No image available"}
                    </span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {badgeLabel && (
              <div className="absolute left-3 top-3 z-[1] rounded-[3px] bg-sand px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-cream shadow-sm">
                {badgeLabel}
              </div>
            )}

            {currentImage && !currentImageBroken && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openLightbox();
                }}
                aria-label="View full screen"
                className="absolute right-3 top-3 z-[1] flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-sm transition-colors hover:bg-white"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            )}

            {hasMultiple && (
              <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-charcoal/60 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm">
                {safeActive + 1} / {images.length}
              </div>
            )}

            {hasMultiple && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectImage(safeActive - 1);
                  }}
                  className="absolute left-3 top-1/2 z-[1] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-sm transition-colors hover:bg-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  aria-label="Next image"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectImage(safeActive + 1);
                  }}
                  className="absolute right-3 top-1/2 z-[1] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-sm transition-colors hover:bg-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {hasMultiple && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => selectImage(index)}
                aria-label={`Show image ${index + 1}`}
                aria-pressed={safeActive === index}
                className={cn(
                  "relative h-16 w-14 shrink-0 overflow-hidden rounded-[4px] border transition-all duration-200 sm:h-[72px] sm:w-14",
                  safeActive === index
                    ? "border-charcoal ring-1 ring-charcoal/20"
                    : "border-charcoal/10 hover:border-charcoal/30"
                )}
              >
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightboxOpen && currentImage && (
          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
            onClick={closeLightbox}
            onWheel={onLightboxWheel}
            onTouchStart={onLightboxTouchStart}
            onTouchEnd={onLightboxTouchEnd}
            role="dialog"
            aria-modal="true"
            aria-label="Product image viewer"
          >
            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between px-4 pt-4 transition-[opacity,transform] duration-200 ease-out",
                chromeVisible
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-3 opacity-0"
              )}
              aria-hidden={!chromeVisible}
            >
              <div className="w-11" />

              {hasMultiple ? (
                <div className="pointer-events-none rounded-full bg-white/10 px-4 py-1.5 text-[12px] font-medium text-white/80 backdrop-blur-sm">
                  {safeActive + 1} / {images.length}
                </div>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeLightbox();
                }}
                className={cn(
                  "rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20",
                  chromeVisible
                    ? "pointer-events-auto"
                    : "pointer-events-none"
                )}
                aria-label="Close"
                tabIndex={chromeVisible ? 0 : -1}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {hasMultiple && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goLightbox(-1);
                }}
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 sm:left-6"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            <motion.div
              key={safeActive}
              initial={reduced ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduced ? 0 : 0.18 }}
              className="relative flex max-h-[90vh] max-w-[92vw] items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={images[safeActive]}
                alt={`${name} - view ${safeActive + 1}`}
                className="h-auto max-h-[90vh] w-auto max-w-[92vw] object-contain"
              />
            </motion.div>

            {hasMultiple && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goLightbox(1);
                }}
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 sm:right-6"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 z-10 flex max-w-[90vw] -translate-x-1/2 gap-2 overflow-x-auto px-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectImage(index);
                    }}
                    className={cn(
                      "h-11 w-9 shrink-0 overflow-hidden rounded-[3px] border transition-all",
                      safeActive === index
                        ? "border-white/80 ring-1 ring-white/40"
                        : "border-white/20 opacity-50 hover:opacity-80"
                    )}
                  >
                    <img
                      src={image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}