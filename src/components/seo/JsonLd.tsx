import { jsonLdScript, type JsonLd as JsonLdData } from "@/lib/seo/jsonLd";

/**
 * Renders structured data. Server component — no "use client", so the script
 * lands in the initial HTML where crawlers actually read it.
 *
 * Accepts a single object or an array (the homepage emits WebSite +
 * Organization together). `null` entries are dropped, which is how builders
 * signal "not enough real data for this claim".
 */
export default function JsonLd({
  data,
}: {
  data: JsonLdData | (JsonLdData | null)[] | null;
}) {
  if (!data) return null;

  const items = (Array.isArray(data) ? data : [data]).filter(
    (item): item is JsonLdData => item !== null,
  );
  if (items.length === 0) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={jsonLdScript(items.length === 1 ? items[0] : items)}
    />
  );
}
