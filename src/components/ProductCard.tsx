import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface ProductCardProps {
  id: number;
  name: string;
  brand: string;
  slug: string;
  imageUrl: string;
  lowestPrice: number;
  highestPrice: number;
  storeCount: number;
  discount: number | null;
  isAvailable?: boolean;
}

export function ProductCard({ product }: { product: ProductCardProps }) {
  const savings = product.highestPrice - product.lowestPrice;
  const unavailable = product.isAvailable === false;

  return (
    <Link href={`/producto/${product.slug}`}>
      <Card className={`group overflow-hidden transition-shadow hover:shadow-lg h-full ${unavailable ? "opacity-60" : ""}`}>
        <div className="relative aspect-square bg-muted/30 p-4">
          <img
            src={product.imageUrl}
            alt={product.name}
            className={`h-full w-full object-contain transition-transform ${unavailable ? "" : "group-hover:scale-105"}`}
          />
          {unavailable && (
            <Badge className="absolute top-2 left-2 bg-gray-500 hover:bg-gray-500 text-white text-[10px] sm:text-xs">
              Agotado
            </Badge>
          )}
          {!unavailable && product.discount && (
            <Badge className="absolute top-2 right-2 bg-red-500 hover:bg-red-500 text-white">
              -{product.discount}%
            </Badge>
          )}
        </div>
        <CardContent className="p-2.5 sm:p-4">
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">{product.brand}</p>
          <h3 className="font-medium text-xs sm:text-sm line-clamp-2 mb-1.5 sm:mb-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-1 sm:gap-2 mb-1">
            <span className={`text-sm sm:text-lg font-bold ${unavailable ? "text-muted-foreground" : "text-primary"}`}>
              ${product.lowestPrice.toFixed(2)}
            </span>
            {product.highestPrice > product.lowestPrice && (
              <span className="text-[10px] sm:text-xs text-muted-foreground line-through">
                ${product.highestPrice.toFixed(2)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              {unavailable ? "No disponible" : `${product.storeCount} tienda${product.storeCount !== 1 ? "s" : ""}`}
            </span>
            {!unavailable && savings > 0 && (
              <span className="text-[10px] sm:text-xs font-medium text-green-600 hidden sm:inline">
                Ahorra ${savings.toFixed(2)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
