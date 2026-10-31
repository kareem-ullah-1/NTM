import { siteConfig } from "@/lib/site-config";

export const dynamic = "force-static";

export async function GET() {
  const body = `# ${siteConfig.brandName}

> ${siteConfig.brandName} sells premium unstitched men's fabric — Wash & Wear, Cotton, Boski, Latha and Summer Collection — shipped nationwide across Pakistan from ${siteConfig.city}.

${siteConfig.brandName} is an ecommerce retailer, not a marketplace. Customers order directly on the website; orders are dispatched within 48 hours and delivered anywhere in Pakistan. Cash on Delivery is the accepted payment method.

## Pages

- [Homepage](${siteConfig.siteUrl}/): Featured products, collections and current promotions.
- [Shop](${siteConfig.siteUrl}/shop): Full catalog of unstitched men's fabric with category, color and price filtering.
- [About](${siteConfig.siteUrl}/about): Company background and fabric-selection process.
- [Help](${siteConfig.siteUrl}/help): Delivery, ordering, payment, account and returns questions answered.
- [Contact](${siteConfig.siteUrl}/contact): Phone, WhatsApp, email and store address.

## Notes

- Prices are in ${siteConfig.currency} and shown on each product page.
- Product availability, ratings and reviews reflect live data and should be read from the page itself rather than assumed.
- Admin, cart, checkout and account pages are private and intentionally excluded here.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}
