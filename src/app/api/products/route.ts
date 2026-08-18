// @ts-nocheck
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids");

  if (!idsParam) {
    return NextResponse.json({ error: "ids parameter required" }, { status: 400 });
  }

  const ids = idsParam.split(",").map(Number).filter((n) => !isNaN(n));
  if (ids.length === 0) {
    return NextResponse.json({ products: [] });
  }

  try {
    const prisma = getPrisma();
    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      include: {
        category: true,
        storeProducts: {
          where: { isAvailable: true },
          orderBy: { currentPrice: "asc" },
        },
      },
    });

    const result = products.map((p) => {
      const prices = p.storeProducts.map((sp) => Number(sp.currentPrice));
      const lowest = prices.length > 0 ? Math.min(...prices) : 0;
      const highest = prices.length > 0 ? Math.max(...prices) : 0;

      return {
        id: p.id,
        name: p.name,
        brand: p.brand,
        slug: p.slug,
        imageUrl: p.imageUrl || "https://placehold.co/400x400/e2e8f0/475569?text=Producto",
        lowestPrice: lowest,
        highestPrice: highest,
        storeCount: p.storeProducts.length,
        discount: null,
      };
    });

    return NextResponse.json({ products: result });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
