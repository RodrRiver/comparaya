// @ts-nocheck
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://comparaya-193638896472.us-central1.run.app";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/tiendas`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/wishlist`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.3 },
  ];

  const categories = [
    "celulares", "laptops", "tablets", "televisores",
    "audio", "gaming", "accesorios", "componentes",
  ];
  const categoryPages: MetadataRoute.Sitemap = categories.map((slug) => ({
    url: `${baseUrl}/categoria/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  let productPages: MetadataRoute.Sitemap = [];
  try {
    const { getPrisma } = await import("@/lib/db");
    const prisma = getPrisma();
    const products = await prisma.product.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { viewCount: "desc" },
      take: 5000,
    });
    productPages = products.map((p) => ({
      url: `${baseUrl}/producto/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));
  } catch {}

  return [...staticPages, ...categoryPages, ...productPages];
}
