import type { Page } from "puppeteer";
import { BaseScraper, type RawProduct } from "./base";

export class IntelmaxScraper extends BaseScraper {
  readonly storeName = "Intelmax";
  readonly storeSlug = "intelmax";
  readonly baseUrl = "https://tiendaintelmax.net";
  readonly categoryUrls: Record<string, string> = {
    laptops: "/family/laptops",
    monitores: "/family/monitores",
    celulares: "/family/celulares",
    tablets: "/family/tablets233",
    audio: "/family/bocinas",
    audifonos: "/family/audifonos",
    teclados: "/family/teclados213",
    mouse: "/family/mouse214",
    componentes: "/groups/componentes",
    redes: "/groups/networking-telecomunicaciones",
  };

  async extractProducts(page: Page, categoryPath: string): Promise<RawProduct[]> {
    const allProducts: RawProduct[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      const url = currentPage === 1
        ? `${this.baseUrl}${categoryPath}`
        : `${this.baseUrl}${categoryPath}?page=${currentPage}`;

      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
      await this.waitAndScroll(page, 'a[href*="/product/"]');

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

        const nameEls = document.querySelectorAll('h6 a[href*="/product/"]');

        nameEls.forEach((el) => {
          const name = el.textContent?.trim() || "";
          if (!name) return;

          const href = (el as HTMLAnchorElement).href;
          const container = el.closest("div, li, article")?.parentElement || el.parentElement?.parentElement;
          if (!container) return;

          const priceTexts = container.textContent?.match(/\$[\d,.]+/g) || [];
          const prices = priceTexts
            .map((t) => parseFloat(t.replace(/[^0-9.]/g, "")))
            .filter((p) => p > 0);

          const price = prices.length > 0 ? Math.min(...prices) : 0;
          if (price === 0) return;

          const originalPrice = prices.length > 1 ? Math.max(...prices) : null;

          const img = container.querySelector('img[src*="/images/productos/"]');
          const imageUrl = (img as HTMLImageElement)?.src || null;

          const quickView = container.querySelector('a[href*="/quick-view"]');
          const skuMatch = quickView?.getAttribute("href")?.match(/\/product\/([^/]+)\/quick-view/);
          const sku = skuMatch ? skuMatch[1] : null;

          items.push({
            name,
            price,
            originalPrice: originalPrice && originalPrice > price ? originalPrice : null,
            url: href.startsWith("http") ? href : `${baseUrl}${href}`,
            imageUrl,
            sku,
            isAvailable: true,
          });
        });

        return items;
      }, this.baseUrl);

      allProducts.push(...products);

      const nextExists = await page.evaluate(() => {
        const next = document.querySelector('a[rel="next"], .pagination .next:not(.disabled)');
        return !!next;
      });

      hasMore = nextExists && products.length > 0;
      currentPage++;
      if (currentPage > 15) break;
    }

    return allProducts;
  }
}
