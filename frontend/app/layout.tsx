import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { DynamicHeader } from "@/components/layout/DynamicHeader";
import { ConditionalChrome } from "@/components/layout/ConditionalChrome";
import { ScrollProgress } from "@/components/layout/ScrollProgress";
import { Toaster } from "@/components/shared/Toaster";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Providers } from "@/app/providers";
import { siteConfig } from "@/lib/site-config";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { JsonLdScript } from "@/components/shared/JsonLd";
import { Analytics } from "@/components/shared/Analytics";

const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  adjustFontFallback: true,
  preload: true
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  adjustFontFallback: true,
  preload: true
});

const DEFAULT_DESCRIPTION =
  "Premium unstitched wash & wear, cotton, boski, latha and summer fabric for men in Pakistan, shipped nationwide.";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: `${siteConfig.brandName} | Premium Unstitched Men's Fabric`,
    template: `%s | ${siteConfig.brandName}`
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "unstitched fabric Pakistan",
    "men's fabric online",
    "wash and wear fabric",
    "cotton fabric for men",
    "boski fabric",
    "latha fabric",
    "summer fabric Pakistan",
    "buy fabric online Pakistan",
    "NTM Fabrics"
  ],
  applicationName: siteConfig.brandName,
  alternates: {
    canonical: "/"
  },
  robots: {
    index: true,
    follow: true
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.brandName,
    title: `${siteConfig.brandName} | Premium Unstitched Men's Fabric`,
    description: DEFAULT_DESCRIPTION,
    url: siteConfig.siteUrl,
    locale: "en_PK"
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.brandName} | Premium Unstitched Men's Fabric`,
    description: DEFAULT_DESCRIPTION
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon", type: "image/png", sizes: "32x32" }
    ],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }]
  },
  manifest: "/site.webmanifest"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable}`}
    >
      <body className="bg-cream font-sans text-charcoal antialiased">
        <JsonLdScript data={organizationJsonLd()} />
        <JsonLdScript data={websiteJsonLd()} />
        <Analytics />
        <Providers>
          <ScrollProgress />
          <AnnouncementBar />
          <DynamicHeader />
          <CartDrawer />
          <ConditionalChrome>{children}</ConditionalChrome>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
