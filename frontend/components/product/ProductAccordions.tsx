"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
const CARE_INSTRUCTIONS = [
  "NTM Cotton Fabrics in a separate bath. Avoid washing NTM Fabrics along with any other fabrics to save them from the harsh effects of the chemicals used by other manufacturers. NTM coloured and white should also be treated separately",
  "Avoid Leko Finished Lining (Bukram) for Cuffs and collar etc., in tailoring",
  "Use lukewarm water and mild detergent (Bleach free)",
  "Dry Colored fabrics away from direct sunlight",
  "Water temperature should not exceed 60 °C. Garment may be machine laundered only on the setting designed for gentle agitation and/or reduced time for delicate items",
  "Do not bleach coloured fabrics",
  "A spinner or machine dryer may be regularly used at high heat setting",
  "Dry cleaning is not required for cotton fabrics",
  "Regular ironing may be performed at high setting"
];

const DELIVERY_TEXT =
  "Your package will be delivered within 2-5 working days (for local orders) after you place an order. We use premium courier services for all shipments. A signature may be required on receipt of the parcel. If no person is available at your address to take the delivery of the parcel, the carrier will make 2 more attempts to deliver the delivery. Please note that we are unable to change a delivery address once the order has been dispatched.";

const CARE_LABELS = new Set([
  "care",
  "wash & care",
  "wash and care",
  "washing instructions",
  "care instructions"
]);

export { CARE_LABELS };

export function CollapsibleSection({
  title,
  defaultOpen = true,
  children
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div className="border-b border-charcoal/10 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-4 text-left transition-colors"
        aria-expanded={open}
      >
        <span className="text-[13px] font-semibold uppercase tracking-[0.1em] text-charcoal/70 hover:text-charcoal">
          {title}
        </span>
        <span
          className="select-none text-[15px] font-medium leading-none text-charcoal/50"
          aria-hidden
        >
          {open ? "−" : "+"}
        </span>
      </button>
      <div
        className={cn(
          "overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out",
          open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="pb-5 pt-0">{children}</div>
      </div>
    </div>
  );
}

export function CareInstructionsList() {
  return (
    <ul className="space-y-3 text-[13px] leading-relaxed text-charcoal/60">
      {CARE_INSTRUCTIONS.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-0.5 shrink-0 text-charcoal/35">*</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function DeliveryInfo() {
  return (
    <p className="text-[13px] leading-relaxed text-charcoal/60">
      {DELIVERY_TEXT}
    </p>
  );
}
