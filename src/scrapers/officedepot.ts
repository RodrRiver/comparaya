import type { Page } from "puppeteer";
import { BaseScraper, type RawProduct } from "./base";

export class OfficeDepotScraper extends BaseScraper {
  readonly storeName = "Office Depot";
  readonly storeSlug = "office-depot";
  readonly baseUrl = "https://www.officedepot.com.sv";
  readonly categoryUrls: Record<string, string> = {
    electronica: "/officedepotSV/en/c/05-0-0-0",
    computadoras: "/officedepotSV/en/c/04-0-0-0",
    accesorios: "/officedepotSV/en/c/04-07-0-0",
  };

  async extractProducts(page: Page, categoryPath: string): Promise<RawProduct[]> {
    const allProducts: RawProduct[] = [];
    let currentPage = 0;
    let hasMore = true;

    while (hasMore) {
      const url = `${this.baseUrl}${categoryPath}?q=%3Arelevance&page=${currentPage}&pageSize=20`;
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
      await this.waitAndScroll(page, "a[href*='/p/']");

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

        const productLinks = document.querySelectorAll('a[href*="/p/"]');
        const seen = new Set<string>();

        productLinks.forEach((link) => {
          const href = (link as HTMLAnchorElement).href;
          if (seen.has(href)) return;
          seen.add(href);

          const container = link.closest(".product-item, .grid, [class*='product']")
            || link.parentElement?.parentElement;
          if (!container) return;

          const nameEl = container.querySelector("h2, h3, [class*='name'], [class*='title']");
          const name = nameEl?.textContent?.trim() || link.getAttribute("title") || "";
          if (!name) return;

          const priceTexts = container.textContent?.match(/\$[\d,.]+/g) || [];
          const prices = priceTexts.map((t) => parseFloat(t.replace(/[^0-9.]/g, ""))).filter((p) => p > 0);

          const price = prices[0] || 0;
          if (price === 0) return;

          const img = container.querySelector("img");
          const imageUrl = img?.src || null;

          const skuMatch = container.textContent?.match(/SKU:\s*(\d+)/);
          const sku = skuMatch ? skuMatch[1] : null;

          const isAvailable = !container.textContent?.includes("Agotado");

          items.push({
            name,
            price,
            originalPrice: prices.length > 1 ? prices[1] : null,
            url: href.startsWith("http") ? href : `${baseUrl}${href}`,
            imageUrl,
            sku,
            isAvailable,
          });
        });

        return items;
      }, this.baseUrl);

      allProducts.push(...products);

      const nextExists = await page.evaluate(() => {
        const nextLink = document.querySelector('a[rel="next"], .pagination .next a');
        return !!nextLink;
      });

      hasMore = nextExists && products.length > 0;
      currentPage++;
      if (currentPage > 10) break;
    }

    return allProducts;
  }
}
