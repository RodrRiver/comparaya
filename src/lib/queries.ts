// @ts-nocheck
import { getPrisma } from "./db";

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
      imageUrl: p.imageUrl || "https://placehold.co/400x400/e2e8f0/475569?text=Producto",
      category: p.category.slug,
      lowestPrice: lowest,
      highestPrice: highest,
      lowestPriceEver: Number(p.lowestPriceEver) || lowest,
      storeCount: allStorePrices.length,
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
        where: { isAvailable: true },
        include: { store: true },
        orderBy: { currentPrice: "asc" },
      },
    },
  });

  return products.map((p) => {
    const prices = p.storeProducts.map((sp) => Number(sp.currentPrice));
    const lowest = prices.length > 0 ? Math.min(...prices) : 0;
    const highest = prices.length > 0 ? Math.max(...prices) : 0;

    return {
      id: p.id,
      name: p.name,
      brand: p.brand,
      model: p.model,
      slug: p.slug,
      imageUrl: p.imageUrl || "https://placehold.co/400x400/e2e8f0/475569?text=Producto",
      category: p.category.slug,
      lowestPrice: lowest,
      highestPrice: highest,
      lowestPriceEver: Number(p.lowestPriceEver) || lowest,
      storeCount: p.storeProducts.length,
      discount: null as number | null,
    };
  });
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

  const prices = stores.map((s) => s.price);
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const highestPrice = prices.length > 0 ? Math.max(...prices) : 0;

  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    model: product.model,
    slug: product.slug,
    imageUrl: product.imageUrl || "https://placehold.co/400x400/e2e8f0/475569?text=Producto",
    category: product.category.slug,
    lowestPrice,
    highestPrice,
    lowestPriceEver: Number(product.lowestPriceEver) || lowestPrice,
    storeCount: stores.length,
    discount: null as number | null,
    stores,
    priceHistory,
  };
}

export async function getProductsByCategory(categorySlug: string) {
  const category = await getPrisma().category.findUnique({
    where: { slug: categorySlug },
  });
  if (!category) return { category: null, products: [] };

  const products = await getPrisma().product.findMany({
    where: { categoryId: category.id },
    include: {
      category: true,
      storeProducts: {
        where: { isAvailable: true },
        include: { store: true },
        orderBy: { currentPrice: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return {
    category: { name: category.name, slug: category.slug },
    products: products.map((p) => {
      const prices = p.storeProducts.map((sp) => Number(sp.currentPrice));
      const lowest = prices.length > 0 ? Math.min(...prices) : 0;
      const highest = prices.length > 0 ? Math.max(...prices) : 0;

      return {
        id: p.id,
        name: p.name,
        brand: p.brand,
        model: p.model,
        slug: p.slug,
        imageUrl: p.imageUrl || "https://placehold.co/400x400/e2e8f0/475569?text=Producto",
        category: p.category.slug,
        lowestPrice: lowest,
        highestPrice: highest,
        lowestPriceEver: Number(p.lowestPriceEver) || lowest,
        storeCount: p.storeProducts.length,
        discount: null as number | null,
      };
    }),
  };
}

export async function searchProducts(query: string) {
  if (!query.trim()) return [];

  const products = await getPrisma().product.findMany({
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
        where: { isAvailable: true },
        include: { store: true },
        orderBy: { currentPrice: "asc" },
      },
    },
    take: 50,
  });

  return products.map((p) => {
    const prices = p.storeProducts.map((sp) => Number(sp.currentPrice));
    const lowest = prices.length > 0 ? Math.min(...prices) : 0;
    const highest = prices.length > 0 ? Math.max(...prices) : 0;

    return {
      id: p.id,
      name: p.name,
      brand: p.brand,
      model: p.model,
      slug: p.slug,
      imageUrl: p.imageUrl || "https://placehold.co/400x400/e2e8f0/475569?text=Producto",
      category: p.category.slug,
      lowestPrice: lowest,
      highestPrice: highest,
      lowestPriceEver: Number(p.lowestPriceEver) || lowest,
      storeCount: p.storeProducts.length,
      discount: null as number | null,
    };
  });
}

export async function getStores() {
  return getPrisma().store.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}
