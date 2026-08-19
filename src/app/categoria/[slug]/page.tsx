import { notFound } from "next/navigation";
import { mockProducts, categories as mockCategories } from "@/lib/mock-data";
import { getProductsByCategory } from "@/lib/queries";
import { ProductCard } from "@/components/ProductCard";
import Link from "next/link";
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
  const searchParams = await props.searchParams;
  const page = Math.max(1, Number(searchParams.page) || 1);

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
  let totalPages = 1;

  try {
    const result = await getProductsByCategory(slug, page);
    if (result.category) {
      categoryName = result.category.name;
      products = result.products;
      totalPages = result.totalPages;
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
        Página {page} de {totalPages}
      </p>

      {products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              {page > 1 && (
                <Link
                  href={`/categoria/${slug}?page=${page - 1}`}
                  className="px-4 py-2 rounded-lg border hover:bg-muted transition-colors text-sm"
                >
                  Anterior
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2
                )
                .map((p, i, arr) => (
                  <span key={p}>
                    {i > 0 && arr[i - 1] !== p - 1 && (
                      <span className="px-1 text-muted-foreground">…</span>
                    )}
                    <Link
                      href={`/categoria/${slug}?page=${p}`}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        p === page
                          ? "bg-primary text-primary-foreground"
                          : "border hover:bg-muted"
                      }`}
                    >
                      {p}
                    </Link>
                  </span>
                ))}
              {page < totalPages && (
                <Link
                  href={`/categoria/${slug}?page=${page + 1}`}
                  className="px-4 py-2 rounded-lg border hover:bg-muted transition-colors text-sm"
                >
                  Siguiente
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">No hay productos en esta categoría aún.</p>
          <p className="text-sm mt-1">Estamos agregando productos nuevos cada día.</p>
        </div>
      )}
    </div>
  );
}
