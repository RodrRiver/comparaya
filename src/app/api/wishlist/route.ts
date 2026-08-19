// @ts-nocheck
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId requerido" }, { status: 400 });
  }

  const prisma = getPrisma();
  const items = await prisma.wishlist.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          category: true,
          storeProducts: {
            where: { isAvailable: true },
            orderBy: { currentPrice: "asc" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const products = items.map((w) => {
    const prices = w.product.storeProducts.map((sp) => Number(sp.currentPrice));
    const lowest = prices.length > 0 ? Math.min(...prices) : 0;
    const highest = prices.length > 0 ? Math.max(...prices) : 0;

    return {
      id: w.product.id,
      name: w.product.name,
      brand: w.product.brand,
      slug: w.product.slug,
      imageUrl: w.product.imageUrl || "https://placehold.co/400x400/e2e8f0/475569?text=Producto",
      lowestPrice: lowest,
      highestPrice: highest,
      storeCount: w.product.storeProducts.length,
      discount: null,
    };
  });

  return NextResponse.json({ products, productIds: items.map((w) => w.productId) });
}

export async function POST(request: Request) {
  try {
    const { userId, productId } = await request.json();

    if (!userId || !productId) {
      return NextResponse.json({ error: "userId y productId requeridos" }, { status: 400 });
    }

    const prisma = getPrisma();
    const item = await prisma.wishlist.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {},
    });

    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const productId = searchParams.get("productId");

  if (!userId || !productId) {
    return NextResponse.json({ error: "Parámetros requeridos" }, { status: 400 });
  }

  const prisma = getPrisma();
  await prisma.wishlist.deleteMany({
    where: { userId, productId: parseInt(productId) },
  });

  return NextResponse.json({ success: true });
}
