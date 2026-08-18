import "dotenv/config";
import * as cheerio from "cheerio";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { matchProducts, generateSlug } from "../src/scrapers/matcher";
import type { RawProduct } from "../src/scrapers/base";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

// ==================== SIMAN (VTEX API) ====================
async function scrapeSiman(): Promise<RawProduct[]> {
  const BASE = "https://sv.siman.com";
  const categories = [
    "/tecnologia/computadoras",
    "/tecnologia/telefonos",
    "/tecnologia/pantallas",
    "/tecnologia/audio-y-video",
    "/tecnologia/tablets",
    "/tecnologia/videojuegos",
    "/tecnologia/accesorios-de-tecnologia",
  ];

  const all: RawProduct[] = [];
  for (const cat of categories) {
    let from = 0;
    while (true) {
      const url = `${BASE}/api/catalog_system/pub/products/search${cat}?_from=${from}&_to=${from + 49}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) break;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) break;

      for (const p of data) {
        const item = p.items?.[0];
        const offer = item?.sellers?.[0]?.commertialOffer;
        if (!offer || offer.Price === 0) continue;
        all.push({
          name: p.productName || "",
          price: offer.Price,
          originalPrice: offer.ListPrice > offer.Price ? offer.ListPrice : null,
          url: `${BASE}/${p.linkText}/p`,
          imageUrl: item?.images?.[0]?.imageUrl || null,
          sku: item?.itemId || null,
          isAvailable: offer.IsAvailable ?? true,
        });
      }
      from += 50;
      if (data.length < 50) break;
    }
    console.log(`  [Siman] ${cat.split("/").pop()}: ${all.length} total`);
  }
  return all;
}

// ==================== OMNISPORT (HTML) ====================
async function scrapeOmnisport(): Promise<RawProduct[]> {
  const BASE = "https://www.omnisport.com";
  const categories = [
    "/categorias/computadoras",
    "/categorias/celulares",
    "/categorias/video",
    "/categorias/audio",
    "/categorias/gaming",
    "/categorias/tablets",
  ];

  const all: RawProduct[] = [];
  for (const cat of categories) {
    let page = 1;
    while (true) {
      const url = page === 1 ? `${BASE}${cat}` : `${BASE}${cat}?page=${page}`;
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) break;
      const html = await res.text();
      const $ = cheerio.load(html);

      const links = $('a[title^="Ver detalles de"]');
      if (links.length === 0) break;

      links.each((_, el) => {
        const name = $(el).text().trim();
        if (!name) return;
        const href = $(el).attr("href") || "";
        const container = $(el).closest("div").parent();
        const priceTexts = container.text().match(/\$[\d,.]+/g) || [];
        const prices = priceTexts.map((t) => parseFloat(t.replace(/[^0-9.]/g, ""))).filter((p) => p > 0);
        const price = prices.length > 0 ? Math.min(...prices) : 0;
        if (price === 0) return;
        const img = container.find('img[src*="buketomnisportpweb"], img[src*="s3"]').first();

        all.push({
          name,
          price,
          originalPrice: prices.length > 1 ? Math.max(...prices) : null,
          url: href.startsWith("http") ? href : `${BASE}${href}`,
          imageUrl: img.attr("src") || null,
          sku: null,
          isAvailable: true,
        });
      });

      const hasNext = $('a[href*="page="]').length > 0;
      if (!hasNext) break;
      page++;
      if (page > 15) break;
    }
    console.log(`  [Omnisport] ${cat.split("/").pop()}: ${all.length} total`);
  }
  return all;
}

// ==================== RADIOSHACK (HTML/Magento) ====================
async function scrapeRadioshack(): Promise<RawProduct[]> {
  const BASE = "https://www.radioshackla.com/elsalvador";
  const categories = [
    "/c/telefonia",
    "/c/computacion",
    "/c/audio",
    "/c/video",
    "/c/mundo-gamer",
  ];

  const all: RawProduct[] = [];
  for (const cat of categories) {
    let page = 1;
    while (true) {
      const url = page === 1 ? `${BASE}${cat}` : `${BASE}${cat}?p=${page}`;
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) break;
      const html = await res.text();
      const $ = cheerio.load(html);

      const items = $("h3.product-item-name a, h3 a.product-item-link");
      if (items.length === 0) break;

      items.each((_, el) => {
        const name = $(el).text().trim();
        if (!name) return;
        const href = $(el).attr("href") || "";
        const container = $(el).closest("li, .product-item");
        const text = container.text();

        let price = 0;
        let originalPrice: number | null = null;

        const specialMatch = text.match(/Precio especial\s*\$?([\d,.]+)/);
        const regularMatch = text.match(/Precio habitual\s*\$?([\d,.]+)/);

        if (specialMatch) {
          price = parseFloat(specialMatch[1].replace(",", ""));
          if (regularMatch) originalPrice = parseFloat(regularMatch[1].replace(",", ""));
        } else {
          const priceTexts = text.match(/\$[\d,.]+/g) || [];
          const prices = priceTexts.map((t) => parseFloat(t.replace(/[^0-9.]/g, ""))).filter((p) => p > 0);
          price = prices[0] || 0;
        }
        if (price === 0) return;

        const img = container.find('img[src*="media/catalog/product"]').first();

        all.push({
          name,
          price,
          originalPrice: originalPrice && originalPrice > price ? originalPrice : null,
          url: href,
          imageUrl: img.attr("src") || null,
          sku: null,
          isAvailable: true,
        });
      });

      const hasNext = $("a.action.next").length > 0;
      if (!hasNext) break;
      page++;
      if (page > 15) break;
    }
    console.log(`  [RadioShack] ${cat.split("/").pop()}: ${all.length} total`);
  }
  return all;
}

// ==================== INTELMAX (HTML) ====================
async function scrapeIntelmax(): Promise<RawProduct[]> {
  const BASE = "https://tiendaintelmax.net";
  const categories = [
    "/family/laptops",
    "/family/monitores",
    "/family/celulares",
    "/family/tablets233",
    "/family/bocinas",
    "/family/audifonos",
    "/family/teclados213",
    "/family/mouse214",
  ];

  const all: RawProduct[] = [];
  for (const cat of categories) {
    let page = 1;
    while (true) {
      const url = page === 1 ? `${BASE}${cat}` : `${BASE}${cat}?page=${page}`;
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) break;
      const html = await res.text();
      const $ = cheerio.load(html);

      const items = $('h6 a[href*="/product/"]');
      if (items.length === 0) break;

      items.each((_, el) => {
        const name = $(el).text().trim();
        if (!name) return;
        const href = $(el).attr("href") || "";
        const container = $(el).closest("div").parent().parent();
        const priceTexts = container.text().match(/\$[\d,.]+/g) || [];
        const prices = priceTexts.map((t) => parseFloat(t.replace(/[^0-9.]/g, ""))).filter((p) => p > 0);
        const price = prices.length > 0 ? Math.min(...prices) : 0;
        if (price === 0) return;

        const img = container.find('img[src*="/images/productos/"]').first();

        all.push({
          name,
          price,
          originalPrice: prices.length > 1 ? Math.max(...prices) : null,
          url: href.startsWith("http") ? href : `${BASE}${href}`,
          imageUrl: img.attr("src") || null,
          sku: null,
          isAvailable: true,
        });
      });

      const hasNext = $('a[rel="next"]').length > 0 || $(".pagination .next:not(.disabled)").length > 0;
      if (!hasNext) break;
      page++;
      if (page > 15) break;
    }
    console.log(`  [Intelmax] ${cat.split("/").pop()}: ${all.length} total`);
  }
  return all;
}

// ==================== OFFICE DEPOT (HTML) ====================
async function scrapeOfficeDepot(): Promise<RawProduct[]> {
  const BASE = "https://www.officedepot.com.sv";
  const categories = [
    "/officedepotSV/en/c/05-0-0-0",
    "/officedepotSV/en/c/04-0-0-0",
  ];

  const all: RawProduct[] = [];
  for (const cat of categories) {
    let page = 0;
    while (true) {
      const url = `${BASE}${cat}?q=%3Arelevance&page=${page}&pageSize=20`;
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) break;
      const html = await res.text();
      const $ = cheerio.load(html);

      const productLinks = $('a[href*="/p/"]');
      if (productLinks.length === 0) break;

      const seen = new Set<string>();
      productLinks.each((_, el) => {
        const href = $(el).attr("href") || "";
        const fullUrl = href.startsWith("http") ? href : `${BASE}${href}`;
        if (seen.has(fullUrl)) return;
        seen.add(fullUrl);

        const container = $(el).closest(".product-item, .grid").length
          ? $(el).closest(".product-item, .grid")
          : $(el).parent().parent();

        const nameEl = container.find("h2, h3, [class*='name']").first();
        const name = nameEl.text().trim() || $(el).attr("title") || "";
        if (!name) return;

        const priceTexts = container.text().match(/\$[\d,.]+/g) || [];
        const prices = priceTexts.map((t) => parseFloat(t.replace(/[^0-9.]/g, ""))).filter((p) => p > 0);
        const price = prices[0] || 0;
        if (price === 0) return;

        const img = container.find("img").first();
        const isAvailable = !container.text().includes("Agotado");

        all.push({
          name,
          price,
          originalPrice: prices.length > 1 ? prices[1] : null,
          url: fullUrl,
          imageUrl: img.attr("src") || null,
          sku: null,
          isAvailable,
        });
      });

      page++;
      if (page > 10) break;
    }
    console.log(`  [OfficeDepot] ${cat.split("/").pop()}: ${all.length} total`);
  }
  return all;
}

// ==================== ZONA DIGITAL (API) ====================
async function scrapeZonaDigital(): Promise<RawProduct[]> {
  const API = "https://apizd.zonadigitalsv.com/api/ecommerce";
  const SITE = "https://www.zonadigitalsv.com";
  const searchTerms = [
    "monitor", "laptop", "teclado", "mouse", "headset", "procesador",
    "tarjeta", "ssd", "tv", "tablet", "consola", "switch", "playstation",
    "router", "cable", "cargador", "usb", "ram", "motherboard", "case",
    "fuente", "celular", "camara", "impresora", "parlante", "audifonos",
    "disco", "nvme", "gpu", "refrigeracion", "ventilador", "silla",
  ];

  const all = new Map<string, RawProduct>();

  for (const term of searchTerms) {
    let page = 1;
    while (true) {
      try {
        const res = await fetch(`${API}/search_products/`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "Mozilla/5.0" },
          body: JSON.stringify({ search: term, page }),
        });
        if (!res.ok) break;
        const data = await res.json();
        const products = data.products || [];
        if (products.length === 0) break;

        for (const p of products) {
          const slug = p.slug || "";
          if (all.has(slug)) continue;
          const brand = p.marca?.name || null;
          const price = p.precio_general || 0;
          if (price === 0) continue;

          all.set(slug, {
            name: (brand ? `${brand} ` : "") + (p.title || ""),
            price,
            originalPrice: null,
            url: `${SITE}/product/${slug}`,
            imageUrl: p.image || null,
            sku: p.uniqd || null,
            isAvailable: p.state === 1,
          });
        }

        const total = data.total_products || 0;
        if (page * 8 >= total) break;
        page++;
      } catch { break; }
    }
    console.log(`  [ZonaDigital] "${term}": ${all.size} unique total`);
  }

  return Array.from(all.values());
}

// ==================== STORE TO DB ====================
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
      } catch { skipped++; continue; }
    }

    const existing = await prisma.storeProduct.findUnique({
      where: { productId_storeId: { productId: product.id, storeId: store.id } },
    });

    if (existing) {
      await prisma.storeProduct.update({
        where: { id: existing.id },
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
        storeProductId: existing?.id || (await prisma.storeProduct.findUnique({
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

  console.log(`  [${storeSlug}] Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
}

// ==================== MAIN ====================
async function main() {
  const target = process.argv[2];

  const scrapers: Record<string, { fn: () => Promise<RawProduct[]>; slug: string }> = {
    siman: { fn: scrapeSiman, slug: "siman" },
    omnisport: { fn: scrapeOmnisport, slug: "omnisport" },
    radioshack: { fn: scrapeRadioshack, slug: "radioshack" },
    intelmax: { fn: scrapeIntelmax, slug: "intelmax" },
    officedepot: { fn: scrapeOfficeDepot, slug: "office-depot" },
    zonadigital: { fn: scrapeZonaDigital, slug: "zona-digital" },
  };

  const toRun = target && target !== "all"
    ? { [target]: scrapers[target] }
    : scrapers;

  for (const [name, scraper] of Object.entries(toRun)) {
    if (!scraper) { console.log(`Unknown store: ${name}`); continue; }
    console.log(`\n=== ${name.toUpperCase()} ===`);
    try {
      const products = await scraper.fn();
      console.log(`  Raw products: ${products.length}`);
      if (products.length > 0) {
        await storeProducts(products, scraper.slug);
      }
    } catch (err) {
      console.error(`  FAILED: ${err}`);
    }
  }

  const totalProducts = await prisma.product.count();
  const totalListings = await prisma.storeProduct.count();
  console.log(`\n=== DB TOTALS: ${totalProducts} products, ${totalListings} store listings ===`);

  await pool.end();
}

main().catch(console.error);
