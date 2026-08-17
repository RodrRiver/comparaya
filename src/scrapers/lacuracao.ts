import type { Page } from "puppeteer";
import { BaseScraper, type RawProduct } from "./base";

export class LaCuracaoScraper extends BaseScraper {
  readonly storeName = "La Curacao";
  readonly storeSlug = "la-curacao";
  readonly baseUrl = "https://www.lacuracao.com";
  readonly categoryUrls: Record<string, string> = {
    celulares: "/sv/celulares",
    laptops: "/sv/computadoras",
    televisores: "/sv/televisores",
    audio: "/sv/audio",
    tablets: "/sv/tablets",
  };

  async extractProducts(page: Page, categoryPath: string): Promise<RawProduct[]> {
    const allProducts: RawProduct[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      const url = currentPage === 1
        ? `${this.baseUrl}${categoryPath}`
        : `${this.baseUrl}${categoryPath}?page=${currentPage}`;

      try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
      } catch {
        console.log(`[La Curacao] Timeout on ${url}, trying with domcontentloaded`);
        try {
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
          await new Promise((r) => setTimeout(r, 5000));
        } catch {
          break;
        }
      }

      await this.autoScroll(page);
      await new Promise((r) => setTimeout(r, 3000));

      const products = await page.evaluate((baseUrl: string) => {
        const items: {
          name: string;
          price: number;
          originalPrice: number | null;
          url: string;
          imageUrl: string | null;
          sku: string | null;
          isAvailable: boolean;
        }[] = [];

        const cards = document.querySelectorAll(
          '.product-card, .product-item, [class*="ProductCard"], [class*="product-grid"] > div, article'
        );

        const fallbackLinks = cards.length === 0
          ? document.querySelectorAll('a[href*="/sv/"][href*="product"], a[href*="/sv/p/"]')
          : [];

        const elements = cards.length > 0 ? cards : fallbackLinks;

        elements.forEach((el) => {
          const nameEl = el.querySelector("h2, h3, h4, [class*='name'], [class*='title']");
          const name = nameEl?.textContent?.trim() ||
            el.querySelector("a")?.getAttribute("title") || "";
          if (!name || name.length < 3) return;

          const linkEl = el.querySelector("a[href]");
          const href = (linkEl as HTMLAnchorElement)?.href || "";

          const priceTexts = el.textContent?.match(/\$[\d,.]+/g) || [];
          const prices = priceTexts
            .map((t) => parseFloat(t.replace(/[^0-9.]/g, "")))
            .filter((p) => p > 0);

          const price = prices.length > 0 ? Math.min(...prices) : 0;
          if (price === 0) return;

          const originalPrice = prices.length > 1 ? Math.max(...prices) : null;

          const img = el.querySelector("img");
          const imageUrl = (img as HTMLImageElement)?.src || null;

          items.push({
            name,
            price,
            originalPrice: originalPrice && originalPrice > price ? originalPrice : null,
            url: href.startsWith("http") ? href : `${baseUrl}${href}`,
            imageUrl,
            sku: null,
            isAvailable: true,
          });
        });

        return items;
      }, this.baseUrl);

      allProducts.push(...products);

      hasMore = products.length > 0;
      currentPage++;
      if (currentPage > 10) break;

      if (products.length === 0) hasMore = false;
    }

    return allProducts;
  }
}
