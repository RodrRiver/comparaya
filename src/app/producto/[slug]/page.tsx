import { notFound } from "next/navigation";
import { mockProducts } from "@/lib/mock-data";
import { getProductBySlug } from "@/lib/queries";
import { PriceTable } from "@/components/PriceTable";
import { PriceChart } from "@/components/PriceChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Heart, TrendingDown, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

async function getProduct(slug: string) {
  try {
    const dbProduct = await getProductBySlug(slug);
    if (dbProduct && dbProduct.stores.length > 0) return dbProduct;
  } catch {}

  const mock = mockProducts.find((p) => p.slug === slug);
  return mock || null;
}

export async function generateMetadata(
  props: PageProps<"/producto/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProduct(slug);
  if (!product) return { title: "Producto no encontrado" };

  return {
    title: `${product.name} — Desde $${product.lowestPrice.toFixed(2)}`,
    description: `Compara precios de ${product.name} en ${product.storeCount} tiendas de El Salvador. Mejor precio: $${product.lowestPrice.toFixed(2)}.`,
  };
}

export default async function ProductPage(
  props: PageProps<"/producto/[slug]">
) {
  const { slug } = await props.params;
  const product = await getProduct(slug);

  if (!product) notFound();

  const savings = product.highestPrice - product.lowestPrice;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>

      <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8">
        <div>
          <div className="rounded-xl border bg-muted/30 p-8 mb-4">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full max-w-xs mx-auto object-contain"
            />
          </div>
        </div>

        <div>
          <div className="flex items-start gap-2 mb-1">
            <Badge variant="secondary" className="text-xs">
              {product.brand}
            </Badge>
            {product.discount && (
              <Badge className="bg-red-500 hover:bg-red-500 text-white text-xs">
                -{product.discount}% descuento
              </Badge>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold mt-2 mb-4">
            {product.name}
          </h1>

          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl font-bold text-primary">
              Desde ${product.lowestPrice.toFixed(2)}
            </span>
            {savings > 0 && (
              <span className="text-sm text-green-600 font-medium">
                Ahorra hasta ${savings.toFixed(2)}
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            Disponible en {product.storeCount} tienda
            {product.storeCount !== 1 ? "s" : ""}
            &nbsp;&middot;&nbsp; Precio más bajo histórico: $
            {product.lowestPriceEver.toFixed(2)}
          </p>

          <div className="flex gap-3 mb-8">
            <Button className="gap-2">
              <Bell className="h-4 w-4" />
              Crear alerta de precio
            </Button>
            <Button variant="outline" className="gap-2">
              <Heart className="h-4 w-4" />
              Wishlist
            </Button>
          </div>

          <PriceTable
            stores={product.stores}
            lowestPriceEver={product.lowestPriceEver}
          />
        </div>
      </div>

      {"priceHistory" in product && product.priceHistory.length > 0 && (
        <Card className="mt-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-primary" />
              Historial de precios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PriceChart data={product.priceHistory} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
