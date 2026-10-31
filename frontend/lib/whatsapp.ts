import { siteConfig } from "./site-config";

export function buildGeneralWhatsappLink(): string {
  const message = `Assalam-o-Alaikum, I would like to know more about ${siteConfig.brandName} fabrics.`;
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

