import { Clock, Mail, MapPin, MessageCircle, Instagram, Facebook } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { buildGeneralWhatsappLink } from "@/lib/whatsapp";
import { ContactForm } from "@/components/forms/ContactForm";
import { FadeUp } from "@/components/motion/reveal";
import { localBusinessJsonLd } from "@/lib/seo";
import { JsonLdScript } from "@/components/shared/JsonLd";

export const metadata = {
  title: "Contact Us",
  description: `Get in touch with ${siteConfig.brandName} — ${siteConfig.address}. Call, WhatsApp or email us for product and order questions.`,
  keywords: [
    "contact NTM Fabrics",
    "fabric store Faisalabad contact",
    "customer support fabric",
    "WhatsApp fabric order",
    "fabric store location Pakistan",
    "email NTM Fabrics"
  ],
  alternates: { canonical: "/contact" }
};

const infoCards = [
  {
    icon: MessageCircle,
    title: "WhatsApp",
    value: siteConfig.phone,
    href: buildGeneralWhatsappLink()
  },
  {
    icon: Mail,
    title: "Email",
    value: siteConfig.email,
    href: `mailto:${siteConfig.email}`
  },
  {
    icon: MapPin,
    title: "Location",
    value: siteConfig.city,
    href: undefined
  }
];

const socialLinks = [
  { icon: Instagram, label: "Instagram", href: siteConfig.social.instagram },
  { icon: Facebook, label: "Facebook", href: siteConfig.social.facebook }
];

export default function ContactPage() {
  return (
    <div>
      <JsonLdScript data={localBusinessJsonLd()} />

      {/* Intro band */}
      <section className="relative overflow-hidden bg-charcoal py-16 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 1px, transparent 4px)"
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <FadeUp>
            <span className="mb-4 inline-flex items-center gap-2 text-overline uppercase text-sand/60">
              <span className="h-px w-6 bg-sand/30" aria-hidden="true" />
              Contact
            </span>
            <h1 className="font-serif text-display-lg text-cream sm:text-display-xl">
              Get in Touch
            </h1>
            <p className="mt-3 max-w-xl text-[14px] text-cream/50">
              Questions about fabric, an order, or bulk pricing? Reach out and
              our team will get back to you within one business day.
            </p>
          </FadeUp>
        </div>
      </section>

      <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-14">
          {/* Form side */}
          <FadeUp className="rounded-card border border-charcoal/[0.06] bg-white p-6 shadow-sm sm:p-9">
            <h2 className="font-serif text-display-sm font-medium text-charcoal">
              Send us a message
            </h2>
            <p className="mt-1.5 text-[13px] text-charcoal/50">
              Fill in the form below and we'll get back to you shortly.
            </p>
            <div className="mt-7">
              <ContactForm />
            </div>
          </FadeUp>

          {/* Info side */}
          <FadeUp className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {infoCards.map((card) => {
                const content = (
                  <div className="flex h-full items-center gap-3.5 rounded-card border border-charcoal/[0.06] bg-white p-4 transition-all duration-200 hover:border-forest/25 hover:shadow-sm">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest/[0.08]">
                      <card.icon className="h-4.5 w-4.5 text-forest" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-overline uppercase text-charcoal/35">
                        {card.title}
                      </p>
                      <p className="truncate text-[13px] font-medium text-charcoal">
                        {card.value}
                      </p>
                    </div>
                  </div>
                );
                return card.href ? (
                  <a
                    key={card.title}
                    href={card.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {content}
                  </a>
                ) : (
                  <div key={card.title}>{content}</div>
                );
              })}
            </div>

            <div className="rounded-card border border-charcoal/[0.06] bg-white p-6">
              <div className="flex items-center gap-2 text-charcoal">
                <Clock className="h-4 w-4 text-forest" />
                <p className="font-serif text-lg font-medium">Business Hours</p>
              </div>
              <ul className="mt-4 space-y-2 text-[13px] text-charcoal/55">
                {siteConfig.businessHours.map((entry) => (
                  <li key={entry.day} className="flex justify-between">
                    <span>{entry.day}</span>
                    <span
                      className={
                        entry.hours === "CLOSED"
                          ? "font-medium text-rust-dark"
                          : "text-charcoal"
                      }
                    >
                      {entry.hours}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex items-center gap-2 border-t border-charcoal/[0.06] pt-5">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-charcoal/10 text-charcoal/60 transition-colors hover:border-forest hover:text-forest"
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-card border border-charcoal/[0.06] bg-white">
              <div className="h-52 w-full">
                <iframe
                  title="NTM Fabrics location"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(
                    siteConfig.address
                  )}&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="p-4">
                <p className="text-overline uppercase text-charcoal/35">
                  Visit the store
                </p>
                <p className="mt-1 text-[13px] text-charcoal">
                  {siteConfig.address}
                </p>
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </div>
  );
}
