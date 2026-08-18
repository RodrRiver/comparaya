export function ProductJsonLd({
  name,
  brand,
  imageUrl,
  slug,
  lowestPrice,
  highestPrice,
  storeCount,
  stores,
}: {
  name: string;
  brand: string;
  imageUrl: string;
  slug: string;
  lowestPrice: number;
  highestPrice: number;
  storeCount: number;
  stores: { name: string; price: number; url: string; isAvailable: boolean }[];
}) {
  const baseUrl = "https://comparaya-193638896472.us-central1.run.app";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    image: imageUrl,
    brand: { "@type": "Brand", name: brand },
    url: `${baseUrl}/producto/${slug}`,
    offers: {
      "@type": "AggregateOffer",
      lowPrice: lowestPrice.toFixed(2),
      highPrice: highestPrice.toFixed(2),
      priceCurrency: "USD",
      offerCount: storeCount,
      offers: stores.map((s) => ({
        "@type": "Offer",
        price: s.price.toFixed(2),
        priceCurrency: "USD",
        url: s.url,
        seller: { "@type": "Organization", name: s.name },
        availability: s.isAvailable
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      })),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
