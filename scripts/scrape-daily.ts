import "dotenv/config";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { matchProducts, generateSlug } from "../src/scrapers/matcher";
import type { RawProduct } from "../src/scrapers/base";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

// ---- SIMAN (VTEX API) ----
async function scrapeSiman(): Promise<RawProduct[]> {
  const BASE = "https://sv.siman.com";
  const cats = ["/tecnologia/computadoras","/tecnologia/telefonos","/tecnologia/pantallas","/tecnologia/audio-y-video","/tecnologia/tablets","/tecnologia/videojuegos","/tecnologia/accesorios-de-tecnologia"];
  const all: RawProduct[] = [];
  for (const cat of cats) {
    let from = 0;
    while (true) {
      const res = await fetch(`${BASE}/api/catalog_system/pub/products/search${cat}?_from=${from}&_to=${from+49}`, { headers: { Accept: "application/json" } });
      if (!res.ok) break;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) break;
      for (const p of data) {
        const item = p.items?.[0]; const offer = item?.sellers?.[0]?.commertialOffer;
        if (!offer || offer.Price === 0) continue;
        all.push({ name: p.productName||"", price: offer.Price, originalPrice: offer.ListPrice>offer.Price?offer.ListPrice:null, url: `${BASE}/${p.linkText}/p`, imageUrl: item?.images?.[0]?.imageUrl||null, sku: item?.itemId||null, isAvailable: offer.IsAvailable??true });
      }
      from += 50; if (data.length < 50) break;
    }
  }
  return all;
}

// ---- RADIOSHACK (HTML) ----
async function scrapeRadioshack(): Promise<RawProduct[]> {
  const BASE = "https://www.radioshackla.com/elsalvador";
  const cats = ["/c/telefonia","/c/computacion","/c/audio","/c/video","/c/mundo-gamer"];
  const all: RawProduct[] = [];
  for (const cat of cats) {
    let page = 1;
    while (true) {
      const url = page===1 ? `${BASE}${cat}` : `${BASE}${cat}?p=${page}`;
      const res = await fetch(url, { headers: HEADERS }); if (!res.ok) break;
      const $ = cheerio.load(await res.text());
      const items = $("h3.product-item-name a, h3 a.product-item-link"); if (items.length===0) break;
      items.each((_,el)=>{ const name=$(el).text().trim(); if(!name) return; const href=$(el).attr("href")||""; const container=$(el).closest("li, .product-item"); const text=container.text(); let price=0,originalPrice:number|null=null; const sp=text.match(/Precio especial\s*\$?([\d,.]+)/); const rg=text.match(/Precio habitual\s*\$?([\d,.]+)/); if(sp){price=parseFloat(sp[1].replace(",",""));if(rg)originalPrice=parseFloat(rg[1].replace(",",""))}else{const pt=text.match(/\$[\d,.]+/g)||[];const ps=pt.map(t=>parseFloat(t.replace(/[^0-9.]/g,""))).filter(p=>p>0);price=ps[0]||0} if(price===0)return; const img=container.find('img[src*="media/catalog/product"]').first(); all.push({name,price,originalPrice:originalPrice&&originalPrice>price?originalPrice:null,url:href,imageUrl:img.attr("src")||null,sku:null,isAvailable:true}); });
      if(!$("a.action.next").length) break; page++; if(page>15) break;
    }
  }
  return all;
}

// ---- ZONA DIGITAL (API) ----
async function scrapeZonaDigital(): Promise<RawProduct[]> {
  const API = "https://apizd.zonadigitalsv.com/api/ecommerce";
  const SITE = "https://www.zonadigitalsv.com";
  const terms = ["monitor","laptop","teclado","mouse","headset","procesador","tarjeta","ssd","tv","tablet","consola","switch","playstation","router","cable","cargador","usb","ram","motherboard","case","fuente","celular","camara","impresora","parlante","audifonos","disco","nvme","gpu","ventilador","silla"];
  const all = new Map<string,RawProduct>();
  for (const term of terms) {
    let page = 1;
    while (true) {
      try {
        const res = await fetch(`${API}/search_products/`, { method:"POST", headers:{"Content-Type":"application/json",Accept:"application/json","User-Agent":"Mozilla/5.0"}, body:JSON.stringify({search:term,page}) });
        if (!res.ok) break; const data = await res.json(); const products = data.products||[]; if(products.length===0) break;
        for (const p of products) { const slug=p.slug||""; if(all.has(slug)) continue; const brand=p.marca?.name||null; const price=p.precio_general||0; if(price===0) continue; all.set(slug,{name:(brand?`${brand} `:"")+(p.title||""),price,originalPrice:null,url:`${SITE}/product/${slug}`,imageUrl:p.image||null,sku:p.uniqd||null,isAvailable:p.state===1}); }
        if(page*8>=(data.total_products||0)) break; page++;
      } catch { break; }
    }
  }
  return Array.from(all.values());
}

// ---- OMNISPORT (HTML) ----
async function scrapeOmnisport(): Promise<RawProduct[]> {
  const BASE = "https://www.omnisport.com";
  const cats = ["/categorias/computadoras","/categorias/celulares","/categorias/video","/categorias/audio","/categorias/gaming","/categorias/tablets"];
  const all: RawProduct[] = [];
  for (const cat of cats) {
    let page = 1;
    while (true) {
      const url = page===1?`${BASE}${cat}`:`${BASE}${cat}?page=${page}`;
      const res = await fetch(url, { headers: HEADERS }); if(!res.ok) break;
      const $ = cheerio.load(await res.text()); const links=$('a[title^="Ver detalles de"]'); if(links.length===0) break;
      links.each((_,el)=>{ const name=$(el).text().trim(); if(!name) return; const href=$(el).attr("href")||""; const container=$(el).closest("div").parent(); const pt=container.text().match(/\$[\d,.]+/g)||[]; const ps=pt.map(t=>parseFloat(t.replace(/[^0-9.]/g,""))).filter(p=>p>0); const price=ps.length>0?Math.min(...ps):0; if(price===0) return; const img=container.find('img[src*="buketomnisportpweb"],img[src*="s3"]').first(); all.push({name,price,originalPrice:ps.length>1?Math.max(...ps):null,url:href.startsWith("http")?href:`${BASE}${href}`,imageUrl:img.attr("src")||null,sku:null,isAvailable:true}); });
      if(!$('a[href*="page="]').length) break; page++; if(page>15) break;
    }
  }
  return all;
}

// ---- INTELMAX (HTML) ----
async function scrapeIntelmax(): Promise<RawProduct[]> {
  const BASE = "https://tiendaintelmax.net";
  const cats = ["/family/laptops","/family/monitores","/family/celulares","/family/tablets233","/family/bocinas","/family/audifonos","/family/teclados213","/family/mouse214"];
  const all: RawProduct[] = [];
  for (const cat of cats) {
    let page = 1;
    while (true) {
      const url = page===1?`${BASE}${cat}`:`${BASE}${cat}?page=${page}`;
      const res = await fetch(url, { headers: HEADERS }); if(!res.ok) break;
      const $ = cheerio.load(await res.text()); const items=$('h6 a[href*="/product/"]'); if(items.length===0) break;
      items.each((_,el)=>{ const name=$(el).text().trim(); if(!name) return; const href=$(el).attr("href")||""; const container=$(el).closest("div").parent().parent(); const pt=container.text().match(/\$[\d,.]+/g)||[]; const ps=pt.map(t=>parseFloat(t.replace(/[^0-9.]/g,""))).filter(p=>p>0); const price=ps.length>0?Math.min(...ps):0; if(price===0) return; const img=container.find('img[src*="/images/productos/"]').first(); all.push({name,price,originalPrice:ps.length>1?Math.max(...ps):null,url:href.startsWith("http")?href:`${BASE}${href}`,imageUrl:img.attr("src")||null,sku:null,isAvailable:true}); });
      if(!$('a[rel="next"]').length&&!$(".pagination .next:not(.disabled)").length) break; page++; if(page>15) break;
    }
  }
  return all;
}

// ---- OFFICE DEPOT (HTML) ----
async function scrapeOfficeDepot(): Promise<RawProduct[]> {
  const BASE = "https://www.officedepot.com.sv";
  const cats = ["/officedepotSV/en/c/05-0-0-0","/officedepotSV/en/c/04-0-0-0"];
  const all: RawProduct[] = [];
  for (const cat of cats) {
    let page = 0;
    while (true) {
      const res = await fetch(`${BASE}${cat}?q=%3Arelevance&page=${page}&pageSize=20`, { headers: HEADERS }); if(!res.ok) break;
      const $ = cheerio.load(await res.text()); const links=$('a[href*="/p/"]'); if(links.length===0) break;
      const seen = new Set<string>();
      links.each((_,el)=>{ const href=$(el).attr("href")||""; const fullUrl=href.startsWith("http")?href:`${BASE}${href}`; if(seen.has(fullUrl)) return; seen.add(fullUrl); const container=$(el).closest(".product-item, .grid").length?$(el).closest(".product-item, .grid"):$(el).parent().parent(); const nameEl=container.find("h2, h3, [class*='name']").first(); const name=nameEl.text().trim()||$(el).attr("title")||""; if(!name) return; const pt=container.text().match(/\$[\d,.]+/g)||[]; const ps=pt.map(t=>parseFloat(t.replace(/[^0-9.]/g,""))).filter(p=>p>0); const price=ps[0]||0; if(price===0) return; all.push({name,price,originalPrice:ps.length>1?ps[1]:null,url:fullUrl,imageUrl:container.find("img").first().attr("src")||null,sku:null,isAvailable:!container.text().includes("Agotado")}); });
      page++; if(page>10) break;
    }
  }
  return all;
}

// ---- AEON (Puppeteer) ----
async function scrapeAeon(): Promise<RawProduct[]> {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--disable-gpu"] });
  } catch { console.log("  [Aeon] Puppeteer unavailable, skipping"); return []; }
  const cats = ["/shop/category/componentes-procesadores-377","/shop/category/componentes-tarjetas-de-video-405","/shop/category/componentes-memoria-ram-477","/shop/category/perifericos-monitores-487","/shop/category/perifericos-teclados-408","/shop/category/perifericos-mouse-492","/shop/category/perifericos-audifonos-y-headset-433","/shop/category/almacenamiento-ssd-397","/shop/category/redes-switch-400"];
  const all: RawProduct[] = [];
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0");
  for (const cat of cats) {
    try {
      await page.goto(`https://aeon.com.sv${cat}`, { waitUntil: "networkidle2", timeout: 30000 });
      await new Promise(r => setTimeout(r, 3000));
      const products = await page.evaluate(() => { const items: any[] = []; document.querySelectorAll(".oe_product_cart, .o_wsale_product_grid_wrapper, form[action*='cart']").forEach(card => { const n = card.querySelector("h6 a, h5 a, a[itemprop='name']"); const name = n?.textContent?.trim()||""; if(!name||name.length<3) return; const l = card.querySelector("a[href*='/shop/']") as HTMLAnchorElement; const pe = card.querySelector(".oe_currency_value"); const pm = pe?.textContent?.match(/[\d,.]+/); const price = pm?parseFloat(pm[0].replace(",","")):0; if(price===0) return; const img = card.querySelector("img") as HTMLImageElement; items.push({name,price,url:l?.href||"",imageUrl:img?.src||null}); }); return items; });
      for (const p of products) all.push({...p, originalPrice:null, sku:null, isAvailable:true});
    } catch {}
  }
  await browser.close();
  return all;
}

// ---- STORE TO DB ----
async function storeProducts(products: RawProduct[], storeSlug: string) {
  const store = await prisma.store.findUnique({ where: { slug: storeSlug } });
  if (!store) { console.error(`Store ${storeSlug} not found`); return; }
  const matched = await matchProducts(products, storeSlug);
  let created = 0, updated = 0;
  for (const m of matched) {
    const slug = generateSlug(m.extracted.brand, m.extracted.model);
    const category = await prisma.category.findUnique({ where: { slug: m.extracted.category } });
    const categoryId = category?.id || 1;
    let product = await prisma.product.findUnique({ where: { slug } });
    if (!product) { try { product = await prisma.product.create({ data: { name: `${m.extracted.brand} ${m.extracted.model}`.trim(), brand: m.extracted.brand, model: m.extracted.model, categoryId, imageUrl: m.rawProduct.imageUrl, specs: m.extracted.specs||{}, slug, lowestPriceEver: m.rawProduct.price } }); created++; } catch { continue; } }
    const existing = await prisma.storeProduct.findUnique({ where: { productId_storeId: { productId: product.id, storeId: store.id } } });
    if (existing) { await prisma.storeProduct.update({ where: { id: existing.id }, data: { currentPrice: m.rawProduct.price, originalPrice: m.rawProduct.originalPrice, isAvailable: m.rawProduct.isAvailable, storeProductName: m.rawProduct.name, storeUrl: m.rawProduct.url, lastScrapedAt: new Date() } }); updated++; }
    else { await prisma.storeProduct.create({ data: { productId: product.id, storeId: store.id, storeUrl: m.rawProduct.url, storeProductName: m.rawProduct.name, storeSku: m.rawProduct.sku, currentPrice: m.rawProduct.price, originalPrice: m.rawProduct.originalPrice, isAvailable: m.rawProduct.isAvailable } }); }
    await prisma.priceHistory.create({ data: { storeProductId: existing?.id || (await prisma.storeProduct.findUnique({ where: { productId_storeId: { productId: product.id, storeId: store.id } } }))!.id, price: m.rawProduct.price } });
    if (m.rawProduct.price < Number(product.lowestPriceEver || Infinity)) { await prisma.product.update({ where: { id: product.id }, data: { lowestPriceEver: m.rawProduct.price } }); }
  }
  console.log(`  [${storeSlug}] Created: ${created}, Updated: ${updated}`);
}

// ---- CHECK ALERTS ----
async function checkAlerts() {
  const alerts = await prisma.priceAlert.findMany({ where: { isActive: true }, include: { product: { include: { storeProducts: { where: { isAvailable: true }, orderBy: { currentPrice: "asc" }, take: 1, include: { store: true } } } } } });
  let triggered = 0;
  for (const alert of alerts) {
    const bestPrice = alert.product.storeProducts[0];
    if (!bestPrice) continue;
    const current = Number(bestPrice.currentPrice);
    const target = alert.targetPrice ? Number(alert.targetPrice) : null;
    if (target && current > target) continue;
    const lastNotified = alert.lastNotifiedAt;
    if (lastNotified && Date.now() - lastNotified.getTime() < 24 * 60 * 60 * 1000) continue;
    console.log(`  Alert: ${alert.product.name} dropped to $${current} at ${bestPrice.store.name} (target: $${target || "any drop"})`);
    // TODO: Send email via Resend when configured
    await prisma.priceAlert.update({ where: { id: alert.id }, data: { lastNotifiedAt: new Date() } });
    triggered++;
  }
  console.log(`  Alerts checked: ${alerts.length}, triggered: ${triggered}`);
}

// ---- MAIN ----
async function main() {
  const scrapers: [string, string, () => Promise<RawProduct[]>][] = [
    ["Siman", "siman", scrapeSiman],
    ["RadioShack", "radioshack", scrapeRadioshack],
    ["Zona Digital", "zona-digital", scrapeZonaDigital],
    ["Omnisport", "omnisport", scrapeOmnisport],
    ["Intelmax", "intelmax", scrapeIntelmax],
    ["Office Depot", "office-depot", scrapeOfficeDepot],
    ["Aeon", "aeon", scrapeAeon],
  ];

  console.log(`=== DAILY SCRAPE: ${new Date().toISOString()} ===`);

  for (const [name, slug, fn] of scrapers) {
    console.log(`\n--- ${name} ---`);
    try {
      const products = await fn();
      console.log(`  Raw: ${products.length}`);
      if (products.length > 0) await storeProducts(products, slug);
    } catch (err) { console.error(`  FAILED: ${err}`); }
  }

  console.log("\n--- Checking price alerts ---");
  await checkAlerts();

  const total = await prisma.product.count();
  const listings = await prisma.storeProduct.count();
  console.log(`\n=== DONE: ${total} products, ${listings} listings ===`);

  await pool.end();
}

main().catch(console.error);
