import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { matchProducts, generateSlug } from "../src/scrapers/matcher";
import type { RawProduct } from "../src/scrapers/base";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

const SIMAN_BASE = "https://sv.siman.com";
const CATEGORIES = [
  { name: "computadoras", path: "/tecnologia/computadoras" },
  { name: "celulares", path: "/tecnologia/telefonos" },
  { name: "televisores", path: "/tecnologia/pantallas" },
  { name: "audio", path: "/tecnologia/audio-y-video" },
  { name: "tablets", path: "/tecnologia/tablets" },
  { name: "gaming", path: "/tecnologia/videojuegos" },
  { name: "accesorios", path: "/tecnologia/accesorios-de-tecnologia" },
];

async function fetchSimanProducts(): Promise<RawProduct[]> {
  const allProducts: RawProduct[] = [];

  for (const cat of CATEGORIES) {
    let from = 0;
    const pageSize = 50;
    let hasMore = true;

    console.log(`Fetching ${cat.name}...`);

    while (hasMore) {
      const url = `${SIMAN_BASE}/api/catalog_system/pub/products/search${cat.path}?_from=${from}&_to=${from + pageSize - 1}`;

      try {
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) { hasMore = false; break; }

        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) { hasMore = false; break; }

        for (const product of data) {
          const item = product.items?.[0];
          const seller = item?.sellers?.[0];
          const offer = seller?.commertialOffer;

          if (!offer || offer.Price === 0) continue;

          allProducts.push({
            name: product.productName || "",
            price: offer.Price,
            originalPrice: offer.ListPrice > offer.Price ? offer.ListPrice : null,
            url: `${SIMAN_BASE}/${product.linkText}/p`,
            imageUrl: item?.images?.[0]?.imageUrl || null,
            sku: item?.itemId || product.productId?.toString() || null,
            isAvailable: offer.IsAvailable ?? true,
          });
        }

        console.log(`  ${cat.name}: fetched ${data.length} products (total: ${allProducts.length})`);
        from += pageSize;
        if (data.length < pageSize) hasMore = false;
      } catch (err) {
        console.error(`  Error fetching ${cat.name}: ${err}`);
        hasMore = false;
      }
    }
  }

  return allProducts;
}

async function storeProducts(products: RawProduct[]) {
  const store = await prisma.store.findUnique({ where: { slug: "siman" } });
  if (!store) throw new Error("Siman store not found in DB");

  const matched = await matchProducts(products, "siman");
  console.log(`\nMatched ${matched.length} products. Storing in DB...`);

  let created = 0;
  let updated = 0;

  for (const m of matched) {
    const slug = generateSlug(m.extracted.brand, m.extracted.model);

    const category = await prisma.category.findUnique({
      where: { slug: m.extracted.category },
    });
    const categoryId = category?.id || 1;

    let product = await prisma.product.findUnique({ where: { slug } });

    if (!product) {
      try {
        product = await prisma.product.create({
          data: {
            name: `${m.extracted.brand} ${m.extracted.model}`.trim(),
            brand: m.extracted.brand,
            model: m.extracted.model,
            categoryId,
            imageUrl: m.rawProduct.imageUrl,
            specs: m.extracted.specs || {},
            slug,
            lowestPriceEver: m.rawProduct.price,
          },
        });
        created++;
      } catch {
        continue;
      }
    }

    const existingSP = await prisma.storeProduct.findUnique({
      where: { productId_storeId: { productId: product.id, storeId: store.id } },
    });

    if (existingSP) {
      await prisma.storeProduct.update({
        where: { id: existingSP.id },
        data: {
          currentPrice: m.rawProduct.price,
          originalPrice: m.rawProduct.originalPrice,
          isAvailable: m.rawProduct.isAvailable,
          storeProductName: m.rawProduct.name,
          storeUrl: m.rawProduct.url,
          lastScrapedAt: new Date(),
        },
      });
      updated++;
    } else {
      await prisma.storeProduct.create({
        data: {
          productId: product.id,
          storeId: store.id,
          storeUrl: m.rawProduct.url,
          storeProductName: m.rawProduct.name,
          storeSku: m.rawProduct.sku,
          currentPrice: m.rawProduct.price,
          originalPrice: m.rawProduct.originalPrice,
          isAvailable: m.rawProduct.isAvailable,
        },
      });
    }

    await prisma.priceHistory.create({
      data: {
        storeProductId: existingSP?.id || (await prisma.storeProduct.findUnique({
          where: { productId_storeId: { productId: product.id, storeId: store.id } },
        }))!.id,
        price: m.rawProduct.price,
      },
    });

    if (m.rawProduct.price < Number(product.lowestPriceEver || Infinity)) {
      await prisma.product.update({
        where: { id: product.id },
        data: { lowestPriceEver: m.rawProduct.price },
      });
    }
  }

  console.log(`Done! Created: ${created}, Updated: ${updated}`);
}

async function main() {
  console.log("=== Siman Scraper (VTEX API) ===\n");

  const products = await fetchSimanProducts();
  console.log(`\nTotal raw products: ${products.length}`);

  if (products.length > 0) {
    await storeProducts(products);
  }

  const count = await prisma.product.count();
  const spCount = await prisma.storeProduct.count();
  console.log(`\nDB totals: ${count} products, ${spCount} store listings`);

  await pool.end();
}

main().catch(console.error);
