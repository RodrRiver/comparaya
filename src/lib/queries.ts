// @ts-nocheck
import { getPrisma } from "./db";
import { upscaleImageUrl } from "./utils";

const PLACEHOLDER = "https://placehold.co/400x400/e2e8f0/475569?text=Producto";
function productImage(url: string | null): string {
  return upscaleImageUrl(url || PLACEHOLDER);
}

function mapProduct(p: any) {
  const available = p.storeProducts.filter((sp: any) => sp.isAvailable);
  const priceSources = available.length > 0 ? available : p.storeProducts;
  const prices = priceSources.map((sp: any) => Number(sp.currentPrice));
  const lowest = prices.length > 0 ? Math.min(...prices) : 0;
  const highest = prices.length > 0 ? Math.max(...prices) : 0;

  const bestDeal = priceSources.find(
    (sp: any) => sp.originalPrice && Number(sp.originalPrice) > Number(sp.currentPrice)
  );
  const discount = bestDeal
    ? Math.round((1 - Number(bestDeal.currentPrice) / Number(bestDeal.originalPrice)) * 100)
    : null;

  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    model: p.model,
    slug: p.slug,
    imageUrl: productImage(p.imageUrl),
    category: p.category.slug,
    lowestPrice: lowest,
    highestPrice: highest,
    lowestPriceEver: Number(p.lowestPriceEver) || lowest,
    storeCount: p.storeProducts.length,
    availableCount: available.length,
    isAvailable: available.length > 0,
    discount: discount && discount > 0 ? discount : null,
  };
}

export async function getCategories() {
  const categories = await getPrisma().category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { products: true } },
    },
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon || "Cpu",
    count: c._count.products,
  }));
}

export async function getDeals(limit = 8) {
  const storeProducts = await getPrisma().storeProduct.findMany({
    where: {
      isAvailable: true,
      originalPrice: { not: null },
    },
    include: {
      product: {
        include: {
          category: true,
          storeProducts: {
            include: { store: true },
            where: { isAvailable: true },
            orderBy: { currentPrice: "asc" },
          },
        },
      },
      store: true,
    },
    orderBy: { currentPrice: "asc" },
    take: limit * 3,
  });

  const seen = new Set<number>();
  const products = [];

  for (const sp of storeProducts) {
    if (seen.has(sp.productId)) continue;
    seen.add(sp.productId);

    const p = sp.product;
    const allStorePrices = p.storeProducts;
    const lowest = allStorePrices[0]?.currentPrice
      ? Number(allStorePrices[0].currentPrice)
      : Number(sp.currentPrice);
    const highest = allStorePrices.length > 0
      ? Math.max(...allStorePrices.map((s) => Number(s.currentPrice)))
      : lowest;

    const discount = sp.originalPrice
      ? Math.round((1 - Number(sp.currentPrice) / Number(sp.originalPrice)) * 100)
      : null;

    if (!discount || discount <= 0) continue;

    products.push({
      id: p.id,
      name: p.name,
      brand: p.brand,
      model: p.model,
      slug: p.slug,
      imageUrl: productImage(p.imageUrl),
      category: p.category.slug,
      lowestPrice: lowest,
      highestPrice: highest,
      lowestPriceEver: Number(p.lowestPriceEver) || lowest,
      storeCount: allStorePrices.length,
      availableCount: allStorePrices.length,
      isAvailable: true,
      discount,
    });

    if (products.length >= limit) break;
  }

  return products.sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));
}

export async function getPopularProducts(limit = 8) {
  const products = await getPrisma().product.findMany({
    orderBy: { viewCount: "desc" },
    take: limit,
    include: {
      category: true,
      storeProducts: {
        include: { store: true },
        orderBy: { currentPrice: "asc" },
      },
    },
  });

  return products.map(mapProduct);
}

export async function getProductBySlug(slug: string) {
  const product = await getPrisma().product.findUnique({
    where: { slug },
    include: {
      category: true,
      storeProducts: {
        include: {
          store: true,
          priceHistory: {
            orderBy: { scrapedAt: "asc" },
            take: 60,
          },
        },
        orderBy: { currentPrice: "asc" },
      },
    },
  });

  if (!product) return null;

  await getPrisma().product.update({
    where: { id: product.id },
    data: { viewCount: { increment: 1 } },
  });

  const stores = product.storeProducts.map((sp) => ({
    name: sp.store.name,
    slug: sp.store.slug,
    price: Number(sp.currentPrice),
    originalPrice: sp.originalPrice ? Number(sp.originalPrice) : null,
    url: sp.storeUrl,
    isAvailable: sp.isAvailable,
  }));

  const priceHistory = product.storeProducts.flatMap((sp) =>
    sp.priceHistory.map((ph) => ({
      date: ph.scrapedAt.toISOString().split("T")[0],
      price: Number(ph.price),
      store: sp.store.name,
    }))
  );

  const available = stores.filter((s) => s.isAvailable);
  const priceSources = available.length > 0 ? available : stores;
  const lowestPrice = priceSources.length > 0 ? Math.min(...priceSources.map((s) => s.price)) : 0;
  const highestPrice = priceSources.length > 0 ? Math.max(...priceSources.map((s) => s.price)) : 0;

  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    model: product.model,
    slug: product.slug,
    imageUrl: productImage(product.imageUrl),
    images: ((product as any).images || []).map(upscaleImageUrl),
    category: product.category.slug,
    lowestPrice,
    highestPrice,
    lowestPriceEver: Number(product.lowestPriceEver) || lowestPrice,
    storeCount: stores.length,
    availableCount: available.length,
    isAvailable: available.length > 0,
    discount: null as number | null,
    stores,
    priceHistory,
  };
}

export async function getProductsByCategory(
  categorySlug: string,
  page = 1,
  pageSize = 40
) {
  const category = await getPrisma().category.findUnique({
    where: { slug: categorySlug },
  });
  if (!category) return { category: null, products: [], totalPages: 0 };

  const total = await getPrisma().product.count({
    where: {
      categoryId: category.id,
      storeProducts: { some: {} },
    },
  });

  const products = await getPrisma().product.findMany({
    where: {
      categoryId: category.id,
      storeProducts: { some: {} },
    },
    include: {
      category: true,
      storeProducts: {
        include: { store: true },
        orderBy: { currentPrice: "asc" },
      },
    },
    orderBy: { name: "asc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    category: { name: category.name, slug: category.slug },
    products: products.map(mapProduct),
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function searchProducts(query: string) {
  if (!query.trim()) return [];

  const prisma = getPrisma();

  // Exact substring match first (fast)
  const exact = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { brand: { contains: query, mode: "insensitive" } },
        { model: { contains: query, mode: "insensitive" } },
      ],
    },
    include: {
      category: true,
      storeProducts: {
        include: { store: true },
        orderBy: { currentPrice: "asc" },
      },
    },
    take: 50,
  });

  if (exact.filter((p) => p.storeProducts.length > 0).length > 0) {
    return exact.filter((p) => p.storeProducts.length > 0).map(mapProduct);
  }

  // Fuzzy search with pg_trgm
  const fuzzyIds: { id: number }[] = await prisma.$queryRawUnsafe(
    `SELECT id FROM products
     WHERE similarity(lower(name), lower($1)) > 0.15
        OR similarity(lower(brand), lower($1)) > 0.15
     ORDER BY GREATEST(similarity(lower(name), lower($1)), similarity(lower(brand), lower($1))) DESC
     LIMIT 50`,
    query
  );

  if (fuzzyIds.length === 0) return [];

  const fuzzy = await prisma.product.findMany({
    where: { id: { in: fuzzyIds.map((r) => r.id) } },
    include: {
      category: true,
      storeProducts: {
        include: { store: true },
        orderBy: { currentPrice: "asc" },
      },
    },
  });

  // Preserve the similarity order from the raw query
  const orderMap = new Map(fuzzyIds.map((r, i) => [r.id, i]));
  fuzzy.sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99));

  return fuzzy.filter((p) => p.storeProducts.length > 0).map(mapProduct);
}

export async function getStores() {
  return getPrisma().store.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function getProductsByStore(storeSlug: string) {
  const store = await getPrisma().store.findUnique({
    where: { slug: storeSlug },
  });
  if (!store) return { store: null, products: [] };

  const storeProducts = await getPrisma().storeProduct.findMany({
    where: { storeId: store.id, isAvailable: true },
    include: {
      product: {
        include: {
          category: true,
          storeProducts: {
            include: { store: true },
            orderBy: { currentPrice: "asc" },
          },
        },
      },
    },
    orderBy: { currentPrice: "asc" },
  });

  const seen = new Set<number>();
  const products = storeProducts
    .filter((sp) => {
      if (seen.has(sp.productId)) return false;
      seen.add(sp.productId);
      return sp.product.storeProducts.length > 0;
    })
    .map((sp) => mapProduct(sp.product));

  return {
    store: { name: store.name, slug: store.slug, url: store.websiteUrl },
    products,
  };
}
