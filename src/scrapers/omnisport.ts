import type { Page } from "puppeteer";
import { BaseScraper, type RawProduct } from "./base";

export class OmnisportScraper extends BaseScraper {
  readonly storeName = "Omnisport";
  readonly storeSlug = "omnisport";
  readonly baseUrl = "https://www.omnisport.com";
  readonly categoryUrls: Record<string, string> = {
    computadoras: "/categorias/computadoras",
    celulares: "/categorias/celulares",
    televisores: "/categorias/video",
    audio: "/categorias/audio",
    gaming: "/categorias/gaming",
    tablets: "/categorias/tablets",
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
      await this.waitAndScroll(page, 'a[href*="/productos/"]');

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

        const nameLinks = document.querySelectorAll('a[title^="Ver detalles de"]');

        nameLinks.forEach((link) => {
          const name = link.textContent?.trim() || "";
          if (!name) return;

          const href = (link as HTMLAnchorElement).href;
          const container = link.closest("div, li, article") || link.parentElement?.parentElement;
          if (!container) return;

          const priceTexts = container.textContent?.match(/\$[\d,.]+/g) || [];
          const prices = priceTexts
            .map((t) => parseFloat(t.replace(/[^0-9.]/g, "")))
            .filter((p) => p > 0);

          const price = prices.length > 0 ? Math.min(...prices) : 0;
          if (price === 0) return;

          const originalPrice = prices.length > 1 ? Math.max(...prices) : null;

          const img = container.querySelector('img[src*="buketomnisportpweb"], img[src*="s3"]');
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

      const nextExists = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="page="]'));
        const currentText = document.querySelector(".active, .current")?.textContent?.trim();
        return links.some((l) => {
          const num = l.textContent?.trim();
          return num && currentText && parseInt(num) > parseInt(currentText);
        });
      });

      hasMore = nextExists && products.length > 0;
      currentPage++;
      if (currentPage > 15) break;
    }

    return allProducts;
  }
}
