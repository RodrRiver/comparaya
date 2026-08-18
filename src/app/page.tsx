import { SearchBar } from "@/components/SearchBar";
import { CategoryGrid } from "@/components/CategoryGrid";
import { ProductCard } from "@/components/ProductCard";
import { mockProducts, categories as mockCategories } from "@/lib/mock-data";
import { getCategories, getDeals, getPopularProducts } from "@/lib/queries";
import { TrendingDown, Bell, Store } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let categories;
  let deals;
  let popular;

  try {
    const [dbCategories, dbDeals, dbPopular] = await Promise.all([
      getCategories(),
      getDeals(8),
      getPopularProducts(4),
    ]);

    categories = dbCategories.length > 0 ? dbCategories : mockCategories;
    deals = dbDeals.length > 0
      ? dbDeals
      : mockProducts.filter((p) => p.discount).sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));
    popular = dbPopular.length > 0 ? dbPopular : mockProducts.slice(0, 4);
  } catch {
    categories = mockCategories;
    deals = mockProducts.filter((p) => p.discount).sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));
    popular = mockProducts.slice(0, 4);
  }

  return (
    <div>
      <section className="bg-gradient-to-b from-primary/5 to-background py-10 sm:py-16 px-4">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
            Compara precios de electrónica
            <br />
            <span className="text-primary">en El Salvador</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
            Encuentra el mejor precio en celulares, laptops, tablets, TVs y más.
            Comparamos 8 tiendas para que no pagues de más.
          </p>
          <SearchBar />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Categorías</h2>
        <CategoryGrid categories={categories} />
      </section>

      {deals.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold">Mejores ofertas</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {deals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Productos populares</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {popular.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-2xl bg-primary/5 border border-primary/10 p-8 text-center">
          <Bell className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Alertas de precio</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Registrate y crea alertas para recibir un correo cuando el precio de
            un producto baje. Nunca más te perderás una oferta.
          </p>
        </div>
      </section>
    </div>
  );
}
