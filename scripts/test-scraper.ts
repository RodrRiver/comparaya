import { runScraper, runAllScrapers } from "../src/scrapers/index";
import { matchProducts, generateSlug } from "../src/scrapers/matcher";

async function main() {
  const store = process.argv[2];

  if (store) {
    console.log(`Testing scraper for: ${store}`);
    const result = await runScraper(store);
    if (!result) {
      console.error("Store not found");
      process.exit(1);
    }

    console.log(`\nRaw products: ${result.products.length}`);
    console.log(`Errors: ${result.errors.length}`);

    if (result.products.length > 0) {
      console.log("\nFirst 5 products:");
      for (const p of result.products.slice(0, 5)) {
        console.log(`  - ${p.name}`);
        console.log(`    Price: $${p.price}${p.originalPrice ? ` (was $${p.originalPrice})` : ""}`);
        console.log(`    URL: ${p.url}`);
        console.log(`    Available: ${p.isAvailable}`);
      }

      console.log("\nRunning AI matcher...");
      const matched = await matchProducts(result.products.slice(0, 5), store);
      for (const m of matched) {
        console.log(`  - ${m.extracted.brand} | ${m.extracted.model} | ${m.extracted.category}`);
        console.log(`    Slug: ${generateSlug(m.extracted.brand, m.extracted.model)}`);
        console.log(`    Specs: ${JSON.stringify(m.extracted.specs)}`);
      }
    }
  } else {
    console.log("Usage: npx tsx scripts/test-scraper.ts <store-slug>");
    console.log("       npx tsx scripts/test-scraper.ts all");
    console.log("\nStores: office-depot, siman, omnisport, aeon, intelmax, radioshack, la-curacao");
  }
}

main().catch(console.error);
