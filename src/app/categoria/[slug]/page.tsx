import { notFound } from "next/navigation";
import { mockProducts, categories as mockCategories } from "@/lib/mock-data";
import { getProductsByCategory } from "@/lib/queries";
import { ProductCard } from "@/components/ProductCard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/categoria/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const cat = mockCategories.find((c) => c.slug === slug);
  const name = cat?.name || slug;

  return {
    title: `${name} — Compara precios`,
    description: `Compara precios de ${name.toLowerCase()} en tiendas de El Salvador.`,
  };
}

export default async function CategoryPage(
  props: PageProps<"/categoria/[slug]">
) {
  const { slug } = await props.params;

  let categoryName: string | null = null;
  let products: Array<{
    id: number;
    name: string;
    brand: string;
    model: string;
    slug: string;
    imageUrl: string;
    category: string;
    lowestPrice: number;
    highestPrice: number;
    lowestPriceEver: number;
    storeCount: number;
    discount: number | null;
  }> = [];

  try {
    const result = await getProductsByCategory(slug);
    if (result.category) {
      categoryName = result.category.name;
      products = result.products;
    }
  } catch {}

  if (!categoryName) {
    const mockCat = mockCategories.find((c) => c.slug === slug);
    if (!mockCat) notFound();
    categoryName = mockCat.name;
    products = mockProducts.filter((p) => p.category === slug);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{categoryName}</h1>
      <p className="text-muted-foreground mb-8">
        {products.length} producto{products.length !== 1 ? "s" : ""} encontrado
        {products.length !== 1 ? "s" : ""}
      </p>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">No hay productos en esta categoría aún.</p>
          <p className="text-sm mt-1">Estamos agregando productos nuevos cada día.</p>
        </div>
      )}
    </div>
  );
}
