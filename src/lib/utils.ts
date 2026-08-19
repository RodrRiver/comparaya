import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function upscaleImageUrl(url: string): string {
  if (!url || url.includes("placehold.co")) return url;

  // Omnisport: products-thumbs → products (full-size)
  if (url.includes("buketomnisportpweb") && url.includes("products-thumbs")) {
    return url.replace("products-thumbs", "products");
  }

  // Aeon (Odoo): image_512 → image_1024
  if (url.includes("aeon.com.sv") && url.includes("/image_512")) {
    return url.replace("/image_512", "/image_1024");
  }

  // RadioShack (Magento): optimize=medium → optimize=high, add width
  if (url.includes("radioshackla.com") && url.includes("media/catalog/product")) {
    const base = url.split("?")[0];
    return `${base}?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800`;
  }

  // Office Depot: relative URLs → absolute, 300ftw → 515ftw
  if (url.startsWith("/medias/") && url.includes("ftw")) {
    const absolute = `https://www.officedepot.com.sv${url}`;
    return absolute.replace("300ftw", "515ftw");
  }

  // Siman (VTEX): add size suffix if not present
  if (url.includes("vteximg.com.br") && !url.includes("-800-800")) {
    return url.replace(/\.(jpg|png|jpeg|webp)/i, "-800-800.$1");
  }

  // La Curacao (Shopify): append width param
  if (url.includes("cdn.shopify.com") && !url.includes("width=")) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}width=800`;
  }

  return url;
}
