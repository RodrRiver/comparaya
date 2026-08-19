import { notFound } from "next/navigation";
import { getProductsByStore } from "@/lib/queries";
import { ProductCard } from "@/components/ProductCard";
import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/tienda/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const { store } = await getProductsByStore(slug);
  if (!store) return { title: "Tienda no encontrada" };

  return {
    title: `${store.name} — Productos y precios`,
    description: `Todos los productos de ${store.name} disponibles para comparar precios en El Salvador.`,
  };
}

export default async function StorePage(props: PageProps<"/tienda/[slug]">) {
  const { slug } = await props.params;
  const { store, products } = await getProductsByStore(slug);

  if (!store) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-3xl font-bold">{store.name}</h1>
        <a
          href={store.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-5 w-5" />
        </a>
      </div>
      <p className="text-muted-foreground mb-8">
        {products.length} producto{products.length !== 1 ? "s" : ""} disponible
        {products.length !== 1 ? "s" : ""}
      </p>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">No hay productos disponibles de esta tienda.</p>
        </div>
      )}
    </div>
  );
}
