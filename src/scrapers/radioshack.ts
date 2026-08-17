import type { Page } from "puppeteer";
import { BaseScraper, type RawProduct } from "./base";

export class RadioShackScraper extends BaseScraper {
  readonly storeName = "RadioShack";
  readonly storeSlug = "radioshack";
  readonly baseUrl = "https://www.radioshackla.com/elsalvador";
  readonly categoryUrls: Record<string, string> = {
    celulares: "/c/telefonia",
    laptops: "/c/computacion",
    audio: "/c/audio",
    televisores: "/c/video",
    gaming: "/c/mundo-gamer",
    accesorios: "/c/cables-y-adaptadores",
  };

  async extractProducts(page: Page, categoryPath: string): Promise<RawProduct[]> {
    const allProducts: RawProduct[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      const url = currentPage === 1
        ? `${this.baseUrl}${categoryPath}`
        : `${this.baseUrl}${categoryPath}?p=${currentPage}`;

      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
      await this.waitAndScroll(page, "h3 a");

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

        const productHeadings = document.querySelectorAll("li h3 a, .product-item h3 a");

        productHeadings.forEach((el) => {
          const name = el.textContent?.trim() || "";
          if (!name) return;

          const href = (el as HTMLAnchorElement).href;
          const container = el.closest("li, .product-item") || el.parentElement?.parentElement;
          if (!container) return;

          const text = container.textContent || "";

          let price = 0;
          let originalPrice: number | null = null;

          const specialMatch = text.match(/Precio especial\s*\$?([\d,.]+)/);
          const regularMatch = text.match(/Precio habitual\s*\$?([\d,.]+)/);

          if (specialMatch) {
            price = parseFloat(specialMatch[1].replace(",", ""));
            if (regularMatch) {
              originalPrice = parseFloat(regularMatch[1].replace(",", ""));
            }
          } else {
            const priceTexts = text.match(/\$[\d,.]+/g) || [];
            const prices = priceTexts
              .map((t) => parseFloat(t.replace(/[^0-9.]/g, "")))
              .filter((p) => p > 0);
            price = prices[0] || 0;
          }

          if (price === 0) return;

          const img = container.querySelector('img[src*="media/catalog/product"]');
          const imageUrl = (img as HTMLImageElement)?.src || null;

          const skuMatch = href.match(/\/([^/]+)\/p$/);
          const sku = skuMatch ? skuMatch[1] : null;

          items.push({
            name,
            price,
            originalPrice: originalPrice && originalPrice > price ? originalPrice : null,
            url: href,
            imageUrl,
            sku,
            isAvailable: true,
          });
        });

        return items;
      }, this.baseUrl);

      allProducts.push(...products);

      const nextExists = await page.evaluate(() => {
        const next = document.querySelector('a.action.next, a[rel="next"]');
        return !!next;
      });

      hasMore = nextExists && products.length > 0;
      currentPage++;
      if (currentPage > 15) break;
    }

    return allProducts;
  }
}
