import "dotenv/config";
import puppeteer from "puppeteer";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { matchProducts, generateSlug } from "../src/scrapers/matcher";
import type { RawProduct } from "../src/scrapers/base";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function scrapeAeon(): Promise<RawProduct[]> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  const categories = [
    "/shop/category/computadoras-pc-gamer-series-418",
    "/shop/category/computadoras-pc-pro-series-420",
    "/shop/category/computadoras-pc-standard-series-500",
    "/shop/category/computadoras-laptops-423",
    "/shop/category/componentes-procesadores-377",
    "/shop/category/componentes-tarjetas-de-video-405",
    "/shop/category/componentes-memoria-ram-477",
    "/shop/category/componentes-motherboard-489",
    "/shop/category/almacenamiento-ssd-397",
    "/shop/category/almacenamiento-m-2-476",
    "/shop/category/perifericos-monitores-487",
    "/shop/category/perifericos-teclados-408",
    "/shop/category/perifericos-mouse-492",
    "/shop/category/perifericos-audifonos-y-headset-433",
    "/shop/category/redes-switch-400",
  ];

  const all: RawProduct[] = [];
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");

  for (const cat of categories) {
    let pageNum = 1;
    while (true) {
      const url = pageNum === 1
        ? `https://aeon.com.sv${cat}`
        : `https://aeon.com.sv${cat}?page=${pageNum}`;

      try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
        await new Promise((r) => setTimeout(r, 3000));

        const products = await page.evaluate(() => {
          const items: { name: string; price: number; url: string; imageUrl: string | null }[] = [];
          const cards = document.querySelectorAll(
            ".oe_product_cart, .o_wsale_product_grid_wrapper, [class*='product-card'], form[action*='cart']"
          );

          cards.forEach((card) => {
            const nameEl = card.querySelector("h6 a, h5 a, [class*='product-title'] a, a[itemprop='name']");
            const name = nameEl?.textContent?.trim() || "";
            if (!name || name.length < 3) return;

            const linkEl = card.querySelector("a[href*='/shop/']") as HTMLAnchorElement;
            const href = linkEl?.href || "";

            const priceEl = card.querySelector(".oe_currency_value, [class*='product-price']");
            const priceText = priceEl?.textContent || "";
            const priceMatch = priceText.match(/[\d,.]+/);
            const price = priceMatch ? parseFloat(priceMatch[0].replace(",", "")) : 0;
            if (price === 0) return;

            const img = card.querySelector("img") as HTMLImageElement;
            items.push({ name, price, url: href, imageUrl: img?.src || null });
          });

          return items;
        });

        if (products.length === 0) {
          const noProducts = await page.evaluate(() =>
            document.body.textContent?.includes("No pudimos encontrar") || false
          );
          if (noProducts || pageNum > 1) break;
        }

        for (const p of products) {
          all.push({
            ...p,
            originalPrice: null,
            sku: null,
            isAvailable: true,
          });
        }

        console.log(`  [Aeon] ${cat.split("/").pop()}: found ${products.length} (total: ${all.length})`);

        const hasNext = await page.evaluate(() => {
          const next = document.querySelector('.pagination a[rel="next"], .next a');
          return !!next;
        });
        if (!hasNext || products.length === 0) break;
        pageNum++;
      } catch (err) {
        console.log(`  [Aeon] Error on ${cat}: ${err}`);
        break;
      }
    }
  }

  await browser.close();
  return all;
}

async function scrapeLaCuracao(): Promise<RawProduct[]> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  const categories = [
    "/sv/celulares",
    "/sv/computadoras",
    "/sv/televisores",
    "/sv/audio",
    "/sv/tablets",
  ];

  const all: RawProduct[] = [];
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");

  for (const cat of categories) {
    try {
      await page.goto(`https://www.lacuracao.com${cat}`, {
        waitUntil: "networkidle2",
        timeout: 45000,
      });
      await new Promise((r) => setTimeout(r, 5000));

      let prevCount = 0;
      for (let scroll = 0; scroll < 10; scroll++) {
        await page.evaluate(() => window.scrollBy(0, 1000));
        await new Promise((r) => setTimeout(r, 1500));
        const count = await page.evaluate(() =>
          document.querySelectorAll(".product-item, .product-collection, [class*='ProductCard']").length
        );
        if (count === prevCount) break;
        prevCount = count;
      }

      const products = await page.evaluate(() => {
        const items: { name: string; price: number; originalPrice: number | null; url: string; imageUrl: string | null }[] = [];

        const cards = document.querySelectorAll(
          ".product-item, .product-collection, [class*='product-card']"
        );

        cards.forEach((card) => {
          const nameEl = card.querySelector(
            ".product-collection__title a, h2 a, h3 a, [class*='product-name'] a"
          );
          const name = nameEl?.textContent?.trim() || "";
          if (!name || name.length < 3) return;

          const href = (nameEl as HTMLAnchorElement)?.href || "";

          const currentEl = card.querySelector(".current span, .money span, .price span.current");
          const compareEl = card.querySelector(".compare span, .price--sale .compare");

          const currentText = currentEl?.textContent || "";
          const compareText = compareEl?.textContent || "";

          const parseP = (t: string) => {
            const m = t.match(/[\d,.]+/);
            return m ? parseFloat(m[0].replace(",", "")) : 0;
          };

          const price = parseP(currentText);
          if (price === 0) return;
          const originalPrice = parseP(compareText);

          const img = card.querySelector("img") as HTMLImageElement;
          items.push({
            name,
            price,
            originalPrice: originalPrice > price ? originalPrice : null,
            url: href,
            imageUrl: img?.src || null,
          });
        });

        return items;
      });

      for (const p of products) {
        all.push({ ...p, sku: null, isAvailable: true });
      }

      console.log(`  [LaCuracao] ${cat.split("/").pop()}: found ${products.length} (total: ${all.length})`);
    } catch (err) {
      console.log(`  [LaCuracao] Error on ${cat}: ${err}`);
    }
  }

  await browser.close();
  return all;
}

async function storeProducts(products: RawProduct[], storeSlug: string) {
  const store = await prisma.store.findUnique({ where: { slug: storeSlug } });
  if (!store) { console.error(`Store ${storeSlug} not found`); return; }

  const matched = await matchProducts(products, storeSlug);
  let created = 0, updated = 0, skipped = 0;

  for (const m of matched) {
    const slug = generateSlug(m.extracted.brand, m.extracted.model);
    const category = await prisma.category.findUnique({ where: { slug: m.extracted.category } });
    const categoryId = category?.id || 1;

    let product = await prisma.product.findUnique({ where: { slug } });

    if (!product) {
      try {
        product = await prisma.product.create({
          data: {
            name: `${m.extracted.brand} ${m.extracted.model}`.trim(),
            brand: m.extracted.brand, model: m.extracted.model,
            categoryId, imageUrl: m.rawProduct.imageUrl,
            specs: m.extracted.specs || {}, slug,
            lowestPriceEver: m.rawProduct.price,
          },
        });
        created++;
      } catch { skipped++; continue; }
    }

    const existing = await prisma.storeProduct.findUnique({
      where: { productId_storeId: { productId: product.id, storeId: store.id } },
    });

    if (existing) {
      await prisma.storeProduct.update({
        where: { id: existing.id },
        data: {
          currentPrice: m.rawProduct.price, originalPrice: m.rawProduct.originalPrice,
          isAvailable: m.rawProduct.isAvailable, storeProductName: m.rawProduct.name,
          storeUrl: m.rawProduct.url, lastScrapedAt: new Date(),
        },
      });
      updated++;
    } else {
      await prisma.storeProduct.create({
        data: {
          productId: product.id, storeId: store.id, storeUrl: m.rawProduct.url,
          storeProductName: m.rawProduct.name, storeSku: m.rawProduct.sku,
          currentPrice: m.rawProduct.price, originalPrice: m.rawProduct.originalPrice,
          isAvailable: m.rawProduct.isAvailable,
        },
      });
    }

    await prisma.priceHistory.create({
      data: {
        storeProductId: existing?.id || (await prisma.storeProduct.findUnique({
          where: { productId_storeId: { productId: product.id, storeId: store.id } },
        }))!.id,
        price: m.rawProduct.price,
      },
    });

    if (m.rawProduct.price < Number(product.lowestPriceEver || Infinity)) {
      await prisma.product.update({ where: { id: product.id }, data: { lowestPriceEver: m.rawProduct.price } });
    }
  }

  console.log(`  [${storeSlug}] Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
}

async function main() {
  const target = process.argv[2] || "all";

  if (target === "aeon" || target === "all") {
    console.log("\n=== AEON COMPUTERS ===");
    try {
      const products = await scrapeAeon();
      console.log(`  Raw products: ${products.length}`);
      if (products.length > 0) await storeProducts(products, "aeon");
    } catch (err) { console.error(`  FAILED: ${err}`); }
  }

  if (target === "lacuracao" || target === "all") {
    console.log("\n=== LA CURACAO ===");
    try {
      const products = await scrapeLaCuracao();
      console.log(`  Raw products: ${products.length}`);
      if (products.length > 0) await storeProducts(products, "la-curacao");
    } catch (err) { console.error(`  FAILED: ${err}`); }
  }

  const total = await prisma.product.count();
  const listings = await prisma.storeProduct.count();
  console.log(`\n=== DB TOTALS: ${total} products, ${listings} store listings ===`);

  await pool.end();
}

main().catch(console.error);
