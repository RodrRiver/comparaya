import { NextResponse } from "next/server";
import { runAllScrapers, runScraper } from "@/scrapers/index";
import { matchProducts, generateSlug } from "@/scrapers/matcher";
import type { ScraperResult } from "@/scrapers/base";

export const maxDuration = 300;

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.SCRAPE_API_KEY;

  if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const store = (body as { store?: string }).store;

  console.log(`[Scrape API] Starting scrape${store ? ` for ${store}` : " for all stores"}`);
  const startTime = Date.now();

  let results: ScraperResult[];

  if (store) {
    const result = await runScraper(store);
    results = result ? [result] : [];
  } else {
    results = await runAllScrapers();
  }

  const allMatched = [];
  for (const result of results) {
    if (result.products.length === 0) continue;

    const matched = await matchProducts(result.products, result.store);
    allMatched.push({
      store: result.store,
      productCount: result.products.length,
      matchedCount: matched.length,
      errors: result.errors,
      products: matched.map((m) => ({
        name: m.rawProduct.name,
        brand: m.extracted.brand,
        model: m.extracted.model,
        category: m.extracted.category,
        price: m.rawProduct.price,
        originalPrice: m.rawProduct.originalPrice,
        url: m.rawProduct.url,
        imageUrl: m.rawProduct.imageUrl,
        slug: generateSlug(m.extracted.brand, m.extracted.model),
        matchKey: m.matchKey,
        isAvailable: m.rawProduct.isAvailable,
      })),
    });
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const totalProducts = allMatched.reduce((sum, r) => sum + r.productCount, 0);

  console.log(`[Scrape API] Done in ${elapsed}s — ${totalProducts} products`);

  return NextResponse.json({
    success: true,
    elapsed: `${elapsed}s`,
    totalProducts,
    stores: allMatched.map((r) => ({
      store: r.store,
      products: r.productCount,
      matched: r.matchedCount,
      errors: r.errors,
    })),
    data: allMatched,
  });
}

export async function GET() {
  return NextResponse.json({
    message: "ComparaYa Scrape API",
    usage: "POST with optional { store: 'store-slug' } to scrape. Auth: Bearer <SCRAPE_API_KEY>",
    stores: [
      "office-depot",
      "siman",
      "omnisport",
      "aeon",
      "intelmax",
      "radioshack",
      "la-curacao",
    ],
  });
}
