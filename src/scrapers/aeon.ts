import type { Page } from "puppeteer";
import { BaseScraper, type RawProduct } from "./base";

export class AeonScraper extends BaseScraper {
  readonly storeName = "Aeon Computers";
  readonly storeSlug = "aeon";
  readonly baseUrl = "https://aeon.com.sv";
  readonly categoryUrls: Record<string, string> = {
    laptops: "/shop/category/computadoras-laptops-423",
    desktops: "/shop/category/computadoras-desktops-419",
    gaming: "/shop/category/computadoras-pc-gamer-series-418",
    componentes: "/shop/category/componentes-377",
    perifericos: "/shop/category/perifericos-440",
    monitores: "/shop/category/perifericos-monitores-441",
    redes: "/shop/category/networking-458",
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
      await this.autoScroll(page);
      await new Promise((r) => setTimeout(r, 2000));

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
          '.oe_product_cart, .o_wsale_product_grid_wrapper, [class*="product-card"], .tp-product-card'
        );

        if (cards.length === 0) {
          const productLinks = document.querySelectorAll('a[href*="/shop/"][href*="product"]');
          productLinks.forEach((link) => {
            const href = (link as HTMLAnchorElement).href;
            const name = link.getAttribute("title") || link.textContent?.trim() || "";
            if (!name || name.length < 3) return;

            const container = link.closest("div, form, section") || link.parentElement;
            if (!container) return;

            const priceTexts = container.textContent?.match(/\$[\d,.]+/g) || [];
            const prices = priceTexts
              .map((t) => parseFloat(t.replace(/[^0-9.]/g, "")))
              .filter((p) => p > 0);
            const price = prices[0] || 0;
            if (price === 0) return;

            const img = container.querySelector("img");
            items.push({
              name,
              price,
              originalPrice: prices.length > 1 && prices[1] > price ? prices[1] : null,
              url: href,
              imageUrl: img?.src || null,
              sku: null,
              isAvailable: true,
            });
          });
          return items;
        }

        cards.forEach((card) => {
          const nameEl = card.querySelector(
            "h6 a, h5 a, .o_wsale_products_item_title, [class*='product-title'] a, a[itemprop='name']"
          );
          const name = nameEl?.textContent?.trim() || "";
          if (!name) return;

          const linkEl = card.querySelector("a[href*='/shop/']");
          const href = (linkEl as HTMLAnchorElement)?.href || "";

          const priceEl = card.querySelector(
            ".oe_currency_value, [class*='product-price'], .tp-product-price, .oe_price"
          );
          const priceText = priceEl?.textContent || card.textContent || "";
          const priceMatch = priceText.match(/[\d,.]+/);
          const price = priceMatch ? parseFloat(priceMatch[0].replace(",", "")) : 0;
          if (price === 0) return;

          const img = card.querySelector("img");
          let imageUrl = img?.src || img?.getAttribute("data-src") || null;
          if (imageUrl && !imageUrl.startsWith("http")) {
            imageUrl = `${baseUrl}${imageUrl}`;
          }

          items.push({
            name,
            price,
            originalPrice: null,
            url: href.startsWith("http") ? href : `${baseUrl}${href}`,
            imageUrl,
            sku: null,
            isAvailable: true,
          });
        });

        return items;
      }, this.baseUrl);

      allProducts.push(...products);

      const noProducts = await page.evaluate(() => {
        return document.body.textContent?.includes("No pudimos encontrar") || false;
      });

      const nextExists = await page.evaluate(() => {
        const next = document.querySelector('.pagination a[rel="next"], .next a');
        return !!next;
      });

      hasMore = !noProducts && nextExists && products.length > 0;
      currentPage++;
      if (currentPage > 10) break;
    }

    return allProducts;
  }
}
