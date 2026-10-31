import { Clock, MapPin, Navigation, Phone } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { buildDirectionsUrl } from "@/lib/maps";
import { Button } from "@/components/ui/button";
import { FadeUp } from "@/components/motion/reveal";

export function FooterStoreMap() {
  const directionsUrl = buildDirectionsUrl();

  return (
    <FadeUp className="border-t border-cream/[0.06] py-12 lg:py-14">
      <h3 className="mb-7 text-overline uppercase text-cream/25">
        Find Our Store
      </h3>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center lg:gap-12">
        {/* Store details */}
        <ul className="space-y-4 text-[13px] leading-relaxed text-cream/45">
          <li className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream/[0.06]">
              <MapPin className="h-4 w-4 text-sand/70" />
            </span>
            <span className="pt-1.5">{siteConfig.address}</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream/[0.06]">
              <Clock className="h-4 w-4 text-sand/70" />
            </span>
            <span className="grid flex-1 grid-cols-[1fr_auto] gap-x-4 gap-y-1 pt-1.5">
              {siteConfig.businessHours.map((entry) => (
                <span key={entry.day} className="contents">
                  <span className="text-cream/40">{entry.day}</span>
                  <span
                    className={
                      entry.hours === "CLOSED"
                        ? "font-medium text-rust-light"
                        : "text-cream/60"
                    }
                  >
                    {entry.hours}
                  </span>
                </span>
              ))}
            </span>
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream/[0.06]">
              <Phone className="h-4 w-4 text-sand/70" />
            </span>
            <span>{siteConfig.phone}</span>
          </li>
        </ul>

        {/* Static map preview -> external Google Maps directions */}
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Get directions to ${siteConfig.brandName} at ${siteConfig.address} on Google Maps (opens in a new tab)`}
          className="group block overflow-hidden rounded-card border border-cream/[0.1] bg-cream/[0.03] transition-colors duration-200 hover:border-sand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal"
        >
          <div className="relative flex h-40 items-center justify-center overflow-hidden sm:h-44">
            {/* subtle map-grid texture */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 28px), repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 28px)",
              }}
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 50% 45%, rgba(173,140,86,0.16), transparent 60%)",
              }}
              aria-hidden="true"
            />

            <span className="absolute left-3 top-3 rounded-full border border-cream/10 bg-charcoal/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-cream/50 backdrop-blur-sm">
              {siteConfig.city}
            </span>

            {/* marker */}
            <span className="relative flex items-center justify-center">
              <span
                className="absolute h-10 w-10 rounded-full bg-sand/20 motion-safe:animate-ping"
                aria-hidden="true"
              />
              <span className="relative flex h-11 w-11 items-center justify-center rounded-full border border-sand/40 bg-charcoal/70 shadow-sm transition-transform duration-200 motion-safe:group-hover:-translate-y-1">
                <MapPin className="h-5 w-5 text-sand" aria-hidden="true" />
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-cream/[0.08] px-4 py-3.5">
            <span className="truncate text-[12.5px] text-cream/50">
              View on Google Maps
            </span>
            <Button
              asChild
              variant="sand"
              size="sm"
              className="pointer-events-none h-8 shrink-0 gap-1.5 px-3.5 text-[11px] transition-transform duration-200 motion-safe:group-hover:translate-x-0.5"
            >
              <span>
                <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                Get Directions
              </span>
            </Button>
          </div>
        </a>
      </div>
    </FadeUp>
  );
}
