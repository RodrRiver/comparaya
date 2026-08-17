import { mockProducts } from "@/lib/mock-data";
import { searchProducts } from "@/lib/queries";
import { ProductCard } from "@/components/ProductCard";
import { SearchBar } from "@/components/SearchBar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buscar productos",
};

export default async function SearchPage(props: PageProps<"/buscar">) {
  const searchParams = await props.searchParams;
  const query = (searchParams.q as string) || "";
  const lower = query.toLowerCase();

  let results: Array<{
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

  if (query) {
    try {
      const dbResults = await searchProducts(query);
      if (dbResults.length > 0) {
        results = dbResults;
      } else {
        results = mockProducts.filter(
          (p) =>
            p.name.toLowerCase().includes(lower) ||
            p.brand.toLowerCase().includes(lower) ||
            p.model.toLowerCase().includes(lower)
        );
      }
    } catch {
      results = mockProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.brand.toLowerCase().includes(lower) ||
          p.model.toLowerCase().includes(lower)
      );
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <SearchBar />
      </div>

      {query ? (
        <>
          <h1 className="text-2xl font-bold mb-2">
            Resultados para &ldquo;{query}&rdquo;
          </h1>
          <p className="text-muted-foreground mb-8">
            {results.length} resultado{results.length !== 1 ? "s" : ""}
          </p>

          {results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg">No encontramos productos.</p>
              <p className="text-sm mt-1">
                Intenta con otro término de búsqueda.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">Busca un producto para comparar precios.</p>
        </div>
      )}
    </div>
  );
}
