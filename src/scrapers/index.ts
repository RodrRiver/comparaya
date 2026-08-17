import { OfficeDepotScraper } from "./officedepot";
import { SimanScraper } from "./siman";
import { OmnisportScraper } from "./omnisport";
import { AeonScraper } from "./aeon";
import { IntelmaxScraper } from "./intelmax";
import { RadioShackScraper } from "./radioshack";
import { LaCuracaoScraper } from "./lacuracao";
import type { BaseScraper } from "./base";
import type { ScraperResult } from "./base";

const scraperClasses: (new () => BaseScraper)[] = [
  OfficeDepotScraper,
  SimanScraper,
  OmnisportScraper,
  AeonScraper,
  IntelmaxScraper,
  RadioShackScraper,
  LaCuracaoScraper,
];

export async function runAllScrapers(): Promise<ScraperResult[]> {
  const results: ScraperResult[] = [];

  for (const ScraperClass of scraperClasses) {
    const scraper = new ScraperClass();
    console.log(`\n=== Starting ${scraper.storeName} ===`);
    try {
      const result = await scraper.scrape();
      results.push(result);
      console.log(
        `=== ${scraper.storeName}: ${result.products.length} products, ${result.errors.length} errors ===`
      );
    } catch (err) {
      console.error(`=== ${scraper.storeName} FAILED: ${err} ===`);
      results.push({
        store: scraper.storeSlug,
        products: [],
        scrapedAt: new Date(),
        errors: [err instanceof Error ? err.message : String(err)],
      });
    }
  }

  const total = results.reduce((sum, r) => sum + r.products.length, 0);
  console.log(`\n=== TOTAL: ${total} products from ${results.length} stores ===`);

  return results;
}

export async function runScraper(storeSlug: string): Promise<ScraperResult | null> {
  const ScraperClass = scraperClasses.find((C) => {
    const instance = new C();
    const match = instance.storeSlug === storeSlug;
    return match;
  });

  if (!ScraperClass) {
    console.error(`Unknown store: ${storeSlug}`);
    return null;
  }

  const scraper = new ScraperClass();
  return scraper.scrape();
}

export type { ScraperResult, RawProduct } from "./base";
