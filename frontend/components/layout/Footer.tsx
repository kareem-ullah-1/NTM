import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, MessageCircle } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

const shop = (params: Record<string, string>) =>
  `/shop?${new URLSearchParams(params).toString()}`;

const shopLinks = [
  { label: "Wash & Wear", href: shop({ category: "Wash & Wear" }) },
  { label: "Premium Cotton", href: shop({ category: "Premium Cotton" }) },
  { label: "Boski", href: shop({ category: "Boski" }) },
  { label: "Latha", href: shop({ category: "Latha" }) },
  { label: "Summer Collection", href: shop({ category: "Summer Collection" }) },
  { label: "Winter Collection", href: shop({ category: "Winter Collection" }) }
];

const companyLinks = [
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" }
];

const supportLinks = [
  { label: "Shop", href: "/shop" },
  { label: "Cart", href: "/cart" },
  { label: "Help", href: "/help" }
];

export function Footer() {
  return (
    <footer className="border-t border-charcoal/[0.08] bg-charcoal">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
        {/* Main footer grid */}
        <div className="grid gap-12 pt-16 pb-12 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
          {/* Brand column */}
          <div>
            <span className="font-serif text-lg tracking-[0.06em] text-cream/90">
              NTM FABRICS
            </span>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-cream/40">
              Premium unstitched fabric for men, selected for comfort, elegance, and everyday confidence.
              Designed for modern traditional wear.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {[
                { href: siteConfig.social.instagram, label: "Instagram", icon: Instagram },
                { href: siteConfig.social.facebook, label: "Facebook", icon: Facebook },
                { href: `https://wa.me/${siteConfig.whatsappNumber}`, label: "WhatsApp", icon: MessageCircle }
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/[0.08] text-cream/35 transition-all duration-200 hover:border-cream/20 hover:text-cream/65"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop links */}
          <div>
            <p className="mb-5 text-overline uppercase text-cream/25">Shop</p>
            <ul className="space-y-2.5">
              {shopLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-cream/40 transition-colors duration-200 hover:text-cream/75"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company + Support */}
          <div>
            <p className="mb-5 text-overline uppercase text-cream/25">Company</p>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-cream/40 transition-colors duration-200 hover:text-cream/75"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mb-5 mt-8 text-overline uppercase text-cream/25">Support</p>
            <ul className="space-y-2.5">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-cream/40 transition-colors duration-200 hover:text-cream/75"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <p className="mb-5 text-overline uppercase text-cream/25">Get in touch</p>
            <ul className="space-y-3.5 text-[13px] text-cream/40">
              <li className="flex items-start gap-2.5">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-sand/50" />
                <span>WhatsApp: {siteConfig.phone}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-sand/50" />
                <span>{siteConfig.email}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sand/50" />
                <span>{siteConfig.address}</span>
              </li>
            </ul>

            <div className="mt-7">
              <p className="mb-2.5 text-overline uppercase text-cream/25">Business Hours</p>
              <ul className="space-y-1 text-[12px] text-cream/30">
                {siteConfig.businessHours.map((entry) => (
                  <li key={entry.day} className="flex justify-between">
                    <span>{entry.day}</span>
                    <span>{entry.hours}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-cream/[0.06] py-6 text-[11px] text-cream/25 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} {siteConfig.brandName}. All rights reserved.</p>
          <p className="tracking-wide">Crafted for the modern Pakistani man.</p>
        </div>
      </div>
    </footer>
  );
}
