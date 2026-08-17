import puppeteer, { type Browser, type Page } from "puppeteer";

export interface RawProduct {
  name: string;
  price: number;
  originalPrice: number | null;
  url: string;
  imageUrl: string | null;
  sku: string | null;
  isAvailable: boolean;
}

export interface ScraperResult {
  store: string;
  products: RawProduct[];
  scrapedAt: Date;
  errors: string[];
}

export abstract class BaseScraper {
  abstract readonly storeName: string;
  abstract readonly storeSlug: string;
  abstract readonly baseUrl: string;
  abstract readonly categoryUrls: Record<string, string>;

  protected browser: Browser | null = null;
  protected page: Page | null = null;

  async init(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });
    this.page = await this.browser.newPage();
    await this.page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    );
    await this.page.setViewport({ width: 1280, height: 800 });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  abstract extractProducts(page: Page, categoryUrl: string): Promise<RawProduct[]>;

  async scrape(): Promise<ScraperResult> {
    const products: RawProduct[] = [];
    const errors: string[] = [];

    try {
      await this.init();

      for (const [category, url] of Object.entries(this.categoryUrls)) {
        try {
          console.log(`[${this.storeName}] Scraping category: ${category}`);
          const categoryProducts = await this.extractProducts(this.page!, url);
          products.push(...categoryProducts);
          console.log(`[${this.storeName}] Found ${categoryProducts.length} products in ${category}`);
        } catch (err) {
          const msg = `Error scraping ${category}: ${err instanceof Error ? err.message : err}`;
          console.error(`[${this.storeName}] ${msg}`);
          errors.push(msg);
        }
      }
    } finally {
      await this.close();
    }

    const unique = this.deduplicateProducts(products);
    console.log(`[${this.storeName}] Total: ${unique.length} unique products`);

    return {
      store: this.storeSlug,
      products: unique,
      scrapedAt: new Date(),
      errors,
    };
  }

  protected deduplicateProducts(products: RawProduct[]): RawProduct[] {
    const seen = new Map<string, RawProduct>();
    for (const p of products) {
      const key = p.url || p.name;
      if (!seen.has(key)) {
        seen.set(key, p);
      }
    }
    return Array.from(seen.values());
  }

  protected parsePrice(text: string): number | null {
    const cleaned = text.replace(/[^0-9.,]/g, "").replace(",", "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  protected async autoScroll(page: Page): Promise<void> {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 400;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= document.body.scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 200);
      });
    });
  }

  protected async waitAndScroll(page: Page, selector: string, timeout = 10000): Promise<void> {
    try {
      await page.waitForSelector(selector, { timeout });
    } catch {
      // selector might not exist if page is empty
    }
    await this.autoScroll(page);
  }
}
