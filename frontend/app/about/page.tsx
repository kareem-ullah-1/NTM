import Image from "next/image";
import Link from "next/link";
import { ArrowRight, PackageCheck, Ruler, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FadeUp,
  ParallaxImage,
  SectionReveal,
  StaggerContainer,
  StaggerItem
} from "@/components/motion/reveal";
import { siteConfig } from "@/lib/site-config";

export const metadata = {
  title: "About Us",
  description: `Learn about ${siteConfig.brandName} — ${siteConfig.brandTagline}. Premium unstitched men's fabric, sourced and delivered from Faisalabad, Pakistan.`,
  keywords: [
    "about NTM Fabrics",
    "fabric brand Faisalabad",
    "premium fabric manufacturer",
    "unstitched fabric quality",
    "men's fabric sourcing",
    "fabric brand story Pakistan",
    "Faisalabad fabric company"
  ],
  alternates: { canonical: "/about" }
};

const timeline = [
  {
    icon: Ruler,
    title: "Selection",
    description:
      "We hand-pick every fabric lot for weave, weight, and hand-feel."
  },
  {
    icon: ShieldCheck,
    title: "Quality Check",
    description:
      "Each batch is checked for colour consistency and durability."
  },
  {
    icon: PackageCheck,
    title: "Packaging",
    description:
      "Folded and packed carefully to keep the fabric crease-free."
  },
  {
    icon: Truck,
    title: "Delivery",
    description:
      "Dispatched within 48 hours to your doorstep, anywhere in Pakistan."
  }
];

export default function AboutPage() {
  return (
    <div>
      {}
      <section className="mx-auto max-w-4xl px-5 pt-16 text-center sm:px-8 lg:px-12">
        <FadeUp>
          <span className="mb-4 inline-flex items-center gap-2 text-overline uppercase text-rust-dark">
            <span className="h-px w-6 bg-rust-dark/40" aria-hidden="true" />
            About NTM Fabrics
          </span>
          <h1 className="font-serif text-display-xl text-charcoal sm:text-display-2xl">
            Good Fabric Begins
            <br />
            <span className="italic">With Good Values</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[14px] leading-relaxed text-charcoal/55">
            NTM Fabrics started with a simple belief: unstitched fabric should
            feel as good as it looks. We work with mills across Punjab to bring
            premium wash &amp; wear, cotton, and boski fabric to men who care
            about how their shalwar kameez fits, drapes, and lasts.
          </p>
        </FadeUp>
      </section>

      {}
      <SectionReveal className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:px-12">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <ParallaxImage className="relative aspect-[4/3] overflow-hidden rounded-[10px] lg:order-2">
            <Image
              src="https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1000&q=80"
              alt="Rolls of fabric in a textile workshop"
              fill
              sizes="(min-width: 1024px) 45vw, 90vw"
              className="object-cover"
            />
          </ParallaxImage>
          <div>
            <h2 className="font-serif text-display-md text-charcoal sm:text-display-lg">
              Our Fabric-Selection Process
            </h2>
            <p className="mt-5 text-[14px] leading-relaxed text-charcoal/55">
              Every lot passes through our hands before it reaches yours. We
              test the drape, check the stitch density, and compare colour
              batches under natural light so what you order is exactly what
              arrives.
            </p>
            <h2 className="mt-10 font-serif text-display-md text-charcoal sm:text-display-lg">
              Our Promise to You
            </h2>
            <p className="mt-5 text-[14px] leading-relaxed text-charcoal/55">
              Transparent pricing in PKR, honest fabric descriptions, and a
              WhatsApp line that&apos;s always staffed by someone who knows the
              collection, not a script.
            </p>
          </div>
        </div>
      </SectionReveal>

      {}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <FadeUp className="text-center">
            <h2 className="font-serif text-display-lg text-charcoal sm:text-display-xl">
              From Selection to Your Door
            </h2>
          </FadeUp>
          <div className="relative mt-14">
            <div className="absolute left-0 right-0 top-6 hidden h-px bg-charcoal/[0.08] md:block" />
            <StaggerContainer className="grid gap-10 md:grid-cols-4">
              {timeline.map((step) => (
                <StaggerItem key={step.title} className="relative text-center">
                  <div className="relative z-10 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-charcoal text-cream">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-5 font-serif text-lg font-medium text-charcoal">
                    {step.title}
                  </p>
                  <p className="mt-2 text-[13px] text-charcoal/55">
                    {step.description}
                  </p>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </div>
      </section>

      {}
      <section className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-8 lg:px-12">
        <FadeUp>
          <h2 className="font-serif text-display-lg text-charcoal sm:text-display-xl">
            Ready to Find Your Fabric?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[14px] text-charcoal/55">
            Browse our curated collection of premium unstitched fabrics and find
            the perfect fit for your next shalwar kameez.
          </p>
          <Button asChild size="lg" className="mt-8 rounded-full px-8">
            <Link href="/shop">
              Shop the Collection
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </FadeUp>
      </section>
    </div>
  );
}
