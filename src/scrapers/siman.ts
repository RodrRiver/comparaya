import type { Page } from "puppeteer";
import { BaseScraper, type RawProduct } from "./base";

export class SimanScraper extends BaseScraper {
  readonly storeName = "Siman";
  readonly storeSlug = "siman";
  readonly baseUrl = "https://sv.siman.com";
  readonly categoryUrls: Record<string, string> = {
    computadoras: "/tecnologia/computadoras",
    celulares: "/tecnologia/telefonos",
    televisores: "/tecnologia/pantallas",
    audio: "/tecnologia/audio-y-video",
    tablets: "/tecnologia/tablets",
    gaming: "/tecnologia/videojuegos",
    accesorios: "/tecnologia/accesorios-de-tecnologia",
  };

  async extractProducts(page: Page, categoryPath: string): Promise<RawProduct[]> {
    const allProducts: RawProduct[] = [];
    let from = 0;
    const pageSize = 50;
    let hasMore = true;

    while (hasMore) {
      const apiUrl = `${this.baseUrl}/api/catalog_system/pub/products/search${categoryPath}?_from=${from}&_to=${from + pageSize - 1}`;

      try {
        const response = await page.evaluate(async (url: string) => {
          const res = await fetch(url, {
            headers: { Accept: "application/json" },
          });
          if (!res.ok) return null;
          return res.json();
        }, apiUrl);

        if (!response || !Array.isArray(response) || response.length === 0) {
          hasMore = false;
          break;
        }

        for (const product of response) {
          try {
            const item = product.items?.[0];
            const seller = item?.sellers?.[0];
            const offer = seller?.commertialOffer;

            if (!offer || offer.Price === 0) continue;

            allProducts.push({
              name: product.productName || product.productTitle || "",
              price: offer.Price,
              originalPrice: offer.ListPrice > offer.Price ? offer.ListPrice : null,
              url: `${this.baseUrl}/${product.linkText}/p`,
              imageUrl: item?.images?.[0]?.imageUrl || null,
              sku: item?.itemId || product.productId?.toString() || null,
              isAvailable: offer.IsAvailable ?? true,
            });
          } catch {
            // skip malformed product
          }
        }

        from += pageSize;
        if (response.length < pageSize) hasMore = false;
      } catch {
        // if API fails, fall back to page scraping
        hasMore = false;
        const fallbackProducts = await this.scrapeFromPage(page, categoryPath);
        allProducts.push(...fallbackProducts);
      }
    }

    return allProducts;
  }

  private async scrapeFromPage(page: Page, categoryPath: string): Promise<RawProduct[]> {
    await page.goto(`${this.baseUrl}${categoryPath}`, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await this.autoScroll(page);

    return page.evaluate((baseUrl: string) => {
      const items: RawProduct[] = [];
      const cards = document.querySelectorAll(
        '[class*="productSummary"], [class*="product-summary"], .vtex-search-result-3-x-galleryItem'
      );

      cards.forEach((card) => {
        const nameEl = card.querySelector('[class*="productBrand"], [class*="productName"], h2, h3');
        const name = nameEl?.textContent?.trim() || "";
        if (!name) return;

        const linkEl = card.querySelector("a[href]");
        const href = linkEl?.getAttribute("href") || "";

        const priceEl = card.querySelector('[class*="sellingPrice"], [class*="Price"]');
        const priceText = priceEl?.textContent || "";
        const priceMatch = priceText.match(/[\d,.]+/);
        const price = priceMatch ? parseFloat(priceMatch[0].replace(",", "")) : 0;
        if (price === 0) return;

        const listPriceEl = card.querySelector('[class*="listPrice"]');
        const listPriceText = listPriceEl?.textContent || "";
        const listMatch = listPriceText.match(/[\d,.]+/);
        const originalPrice = listMatch ? parseFloat(listMatch[0].replace(",", "")) : null;

        const img = card.querySelector("img");
        const imageUrl = img?.src || null;

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
    }, this.baseUrl) as Promise<RawProduct[]>;
  }
}
