"use client";

import { useState, useEffect } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Heart } from "lucide-react";

const STORAGE_KEY = "comparaya-wishlist";

interface WishlistProduct {
  id: number;
  name: string;
  brand: string;
  slug: string;
  imageUrl: string;
  lowestPrice: number;
  highestPrice: number;
  storeCount: number;
  discount: number | null;
}

export default function WishlistPage() {
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWishlist() {
      try {
        const ids: number[] = JSON.parse(
          localStorage.getItem(STORAGE_KEY) || "[]"
        );
        if (ids.length === 0) {
          setLoading(false);
          return;
        }

        const res = await fetch(
          `/api/products?ids=${ids.join(",")}`
        );
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products);
        }
      } catch {}
      setLoading(false);
    }
    loadWishlist();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Mi Wishlist</h1>
      <p className="text-muted-foreground mb-8">
        Tus productos guardados. Se almacenan en tu navegador.
      </p>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">
          Cargando...
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-lg">No tienes productos guardados.</p>
          <p className="text-sm mt-1">
            Usa el botón &ldquo;Guardar&rdquo; en cualquier producto para
            agregarlo aquí.
          </p>
        </div>
      )}
    </div>
  );
}
