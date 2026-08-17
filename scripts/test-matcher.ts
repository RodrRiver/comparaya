import "dotenv/config";
import { matchProducts, generateSlug } from "../src/scrapers/matcher";
import type { RawProduct } from "../src/scrapers/base";

const testProducts: RawProduct[] = [
  {
    name: 'Tablet 11" Galaxy Tab A11 Wifi 8.7" 4GB RAM 64GB ROM gris',
    price: 159.0,
    originalPrice: 195.0,
    url: "https://sv.siman.com/test",
    imageUrl: null,
    sku: "12345",
    isAvailable: true,
  },
  {
    name: "Laptop HP 15-fd1xxx Intel Core Ultra 5 8GB RAM 512GB SSD 15.6\"",
    price: 699.0,
    originalPrice: null,
    url: "https://sv.siman.com/test2",
    imageUrl: null,
    sku: "12346",
    isAvailable: true,
  },
  {
    name: "Audifono inalambrico JBL Tune 520BT Negro",
    price: 39.9,
    originalPrice: 49.9,
    url: "https://sv.siman.com/test3",
    imageUrl: null,
    sku: "12347",
    isAvailable: true,
  },
  {
    name: 'Smart TV Samsung 55" Crystal UHD 4K CU7000',
    price: 449.0,
    originalPrice: 599.0,
    url: "https://sv.siman.com/test4",
    imageUrl: null,
    sku: "12348",
    isAvailable: true,
  },
  {
    name: "Mouse inalambrico Logitech M185 Gris",
    price: 12.9,
    originalPrice: null,
    url: "https://sv.siman.com/test5",
    imageUrl: null,
    sku: "12349",
    isAvailable: true,
  },
];

async function main() {
  console.log("Testing AI matcher with Gemini 3.5 Flash Lite...\n");

  const matched = await matchProducts(testProducts, "siman");

  for (const m of matched) {
    console.log(`Original: ${m.rawProduct.name}`);
    console.log(`  Brand:    ${m.extracted.brand}`);
    console.log(`  Model:    ${m.extracted.model}`);
    console.log(`  Category: ${m.extracted.category}`);
    console.log(`  Specs:    ${JSON.stringify(m.extracted.specs)}`);
    console.log(`  Slug:     ${generateSlug(m.extracted.brand, m.extracted.model)}`);
    console.log();
  }
}

main().catch(console.error);
