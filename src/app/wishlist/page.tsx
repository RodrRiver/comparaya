"use client";

import { useState, useEffect } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Heart, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";

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
  const { user, signIn, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    fetch(`/api/wishlist?userId=${user.uid}`)
      .then((r) => r.json())
      .then((data) => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Mi Wishlist</h1>
        <div className="text-center py-20 text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Mi Wishlist</h1>
        <div className="text-center py-20 text-muted-foreground">
          <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-lg mb-4">Inicia sesión para guardar productos</p>
          <p className="text-sm mb-6">
            Tu wishlist se sincroniza en todos tus dispositivos.
          </p>
          <Button onClick={signIn} className="gap-2">
            <LogIn className="h-4 w-4" />
            Iniciar sesión con Google
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Mi Wishlist</h1>
      <p className="text-muted-foreground mb-8">
        {products.length} producto{products.length !== 1 ? "s" : ""} guardado
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
