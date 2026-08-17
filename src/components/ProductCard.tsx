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
}

export function ProductCard({ product }: { product: ProductCardProps }) {
  const savings = product.highestPrice - product.lowestPrice;

  return (
    <Link href={`/producto/${product.slug}`}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-lg h-full">
        <div className="relative aspect-square bg-muted/30 p-4">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-contain transition-transform group-hover:scale-105"
          />
          {product.discount && (
            <Badge className="absolute top-2 right-2 bg-red-500 hover:bg-red-500 text-white">
              -{product.discount}%
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">{product.brand}</p>
          <h3 className="font-medium text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-lg font-bold text-primary">
              ${product.lowestPrice.toFixed(2)}
            </span>
            {product.highestPrice > product.lowestPrice && (
              <span className="text-xs text-muted-foreground line-through">
                ${product.highestPrice.toFixed(2)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {product.storeCount} tienda{product.storeCount !== 1 ? "s" : ""}
            </span>
            {savings > 0 && (
              <span className="text-xs font-medium text-green-600">
                Ahorra ${savings.toFixed(2)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
