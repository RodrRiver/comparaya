import { GoogleGenAI } from "@google/genai";
import type { RawProduct } from "./base";

export interface MatchedProduct {
  rawProduct: RawProduct;
  extracted: {
    brand: string;
    model: string;
    category: string;
    specs: Record<string, string>;
  };
  matchKey: string;
}

const CATEGORY_MAP: Record<string, string> = {
  celular: "celulares",
  telefono: "celulares",
  smartphone: "celulares",
  iphone: "celulares",
  galaxy: "celulares",
  pixel: "celulares",
  laptop: "laptops",
  notebook: "laptops",
  macbook: "laptops",
  chromebook: "laptops",
  portatil: "laptops",
  tablet: "tablets",
  ipad: "tablets",
  televisor: "televisores",
  "smart tv": "televisores",
  pantalla: "televisores",
  tv: "televisores",
  audifono: "audio",
  bocina: "audio",
  parlante: "audio",
  headphone: "audio",
  airpods: "audio",
  speaker: "audio",
  soundbar: "audio",
  playstation: "gaming",
  xbox: "gaming",
  nintendo: "gaming",
  ps5: "gaming",
  consola: "gaming",
  mouse: "accesorios",
  teclado: "accesorios",
  keyboard: "accesorios",
  webcam: "accesorios",
  cargador: "accesorios",
  cable: "accesorios",
  procesador: "componentes",
  "tarjeta de video": "componentes",
  gpu: "componentes",
  ram: "componentes",
  ssd: "componentes",
  motherboard: "componentes",
  monitor: "componentes",
};

function guessCategory(name: string): string {
  const lower = name.toLowerCase();
  for (const [keyword, category] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(keyword)) return category;
  }
  return "accesorios";
}

function extractBrandFromName(name: string): string {
  const brands = [
    "Samsung", "Apple", "Sony", "LG", "Huawei", "Xiaomi", "HP", "Dell",
    "Lenovo", "ASUS", "Acer", "MSI", "Logitech", "JBL", "Bose", "Razer",
    "HyperX", "Corsair", "Kingston", "Western Digital", "Seagate", "TP-Link",
    "Nintendo", "Microsoft", "Google", "Motorola", "Honor", "Realme", "TCL",
    "Hisense", "Epson", "Canon", "Brother", "Anker", "Skullcandy", "Beats",
    "SteelSeries", "AMD", "Intel", "NVIDIA", "Toshiba", "Westinghouse",
  ];
  const lower = name.toLowerCase();
  for (const brand of brands) {
    if (lower.includes(brand.toLowerCase())) return brand;
  }
  return "Otro";
}

function generateMatchKey(brand: string, model: string): string {
  return `${brand}::${model}`
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9:.-]/g, "");
}

export async function matchProducts(
  products: RawProduct[],
  storeName: string
): Promise<MatchedProduct[]> {
  const projectId = process.env.GCP_PROJECT_ID || "rodrigoaramos-dev";
  const location = process.env.GCP_LOCATION || "us-central1";

  let useAI = true;
  let genai: GoogleGenAI | null = null;

  try {
    genai = new GoogleGenAI({
      vertexai: true,
      project: projectId,
      location,
    });
  } catch {
    console.log("[Matcher] Google GenAI unavailable, using rule-based matching");
    useAI = false;
  }

  const results: MatchedProduct[] = [];
  const batchSize = 10;

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);

    if (useAI && genai) {
      try {
        const aiResults = await matchBatchWithAI(genai, batch, storeName);
        results.push(...aiResults);
        continue;
      } catch (err) {
        console.log(`[Matcher] AI batch failed, falling back to rules: ${err}`);
      }
    }

    for (const product of batch) {
      results.push(matchWithRules(product));
    }
  }

  return results;
}

async function matchBatchWithAI(
  genai: GoogleGenAI,
  products: RawProduct[],
  storeName: string
): Promise<MatchedProduct[]> {
  const productList = products.map((p, i) => `${i + 1}. "${p.name}" - $${p.price}`).join("\n");

  const prompt = `Extract structured product information from these ${storeName} product listings. For each product, return the brand, model name, category, and key specs.

Products:
${productList}

Categories: celulares, laptops, tablets, televisores, audio, gaming, accesorios, componentes

Return ONLY a JSON array with one object per product:
[
  {
    "index": 1,
    "brand": "Samsung",
    "model": "Galaxy S24 Ultra 256GB",
    "category": "celulares",
    "specs": {"storage": "256GB", "ram": "12GB", "color": "black"}
  }
]

Rules:
- brand: The manufacturer (Samsung, Apple, HP, etc.)
- model: The specific model name without the brand (e.g. "Galaxy S24 Ultra 256GB", not "Samsung Galaxy S24 Ultra 256GB")
- category: One of the categories listed above
- specs: Key specifications as key-value pairs (storage, ram, screen_size, color, etc.)
- Return valid JSON only, no markdown`;

  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
  });

  const text = response.text ?? "";

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("No JSON array in response");

  const parsed = JSON.parse(jsonMatch[0]) as Array<{
    index: number;
    brand: string;
    model: string;
    category: string;
    specs: Record<string, string>;
  }>;

  return parsed.map((item) => {
    const product = products[item.index - 1];
    if (!product) throw new Error(`Invalid index ${item.index}`);

    return {
      rawProduct: product,
      extracted: {
        brand: item.brand || extractBrandFromName(product.name),
        model: item.model || product.name,
        category: item.category || guessCategory(product.name),
        specs: item.specs || {},
      },
      matchKey: generateMatchKey(item.brand, item.model),
    };
  });
}

function matchWithRules(product: RawProduct): MatchedProduct {
  const brand = extractBrandFromName(product.name);
  const category = guessCategory(product.name);

  let model = product.name;
  if (brand !== "Otro") {
    model = product.name.replace(new RegExp(brand, "i"), "").trim();
  }

  return {
    rawProduct: product,
    extracted: {
      brand,
      model,
      category,
      specs: {},
    },
    matchKey: generateMatchKey(brand, model),
  };
}

export function generateSlug(brand: string, model: string): string {
  return `${brand}-${model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}
