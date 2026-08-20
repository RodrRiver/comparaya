import Link from "next/link";
import { TrendingDown } from "lucide-react";

const categories = [
  { name: "Celulares", slug: "celulares" },
  { name: "Laptops", slug: "laptops" },
  { name: "Tablets", slug: "tablets" },
  { name: "Televisores", slug: "televisores" },
  { name: "Audio", slug: "audio" },
  { name: "Gaming", slug: "gaming" },
];

const stores = [
  { name: "Office Depot", slug: "office-depot" },
  { name: "Siman", slug: "siman" },
  { name: "Omnisport", slug: "omnisport" },
  { name: "RadioShack", slug: "radioshack" },
  { name: "Aeon Computers", slug: "aeon" },
  { name: "Intelmax", slug: "intelmax" },
  { name: "La Curacao", slug: "la-curacao" },
  { name: "Zona Digital", slug: "zona-digital" },
];

export function Footer() {
  return (
    <footer className="border-t bg-secondary/50 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <TrendingDown className="h-5 w-5 text-primary" />
              <span>
                Compara<span className="text-primary">Ya</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Compara precios de electrónica en El Salvador. Encuentra el mejor
              precio y recibe alertas cuando baje.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">Categorías</h3>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/categoria/${cat.slug}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">Tiendas</h3>
            <ul className="space-y-2">
              {stores.map((store) => (
                <li key={store.slug}>
                  <Link
                    href={`/tienda/${store.slug}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {store.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">Acerca de</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/tiendas"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Todas las tiendas
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
          ComparaYa &mdash; Hecho en El Salvador
        </div>
      </div>
    </footer>
  );
}
