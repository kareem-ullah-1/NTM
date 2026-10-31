import { safeJsonLd } from "@/lib/seo";

type JsonLdProps = {
  data: unknown | unknown[];
};

/**
 * Renders Schema.org JSON-LD. Content is safely serialized to avoid XSS
 * from backend/user-originated strings.
 */
export function JsonLd({ data }: JsonLdProps) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <>
      {payload.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(item) }}
        />
      ))}
    </>
  );
}
