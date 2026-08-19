import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ExternalLink, Check, X } from "lucide-react";

interface StorePrice {
  name: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  url: string;
  isAvailable: boolean;
}

export function PriceTable({
  stores,
  lowestPriceEver,
}: {
  stores: StorePrice[];
  lowestPriceEver: number;
}) {
  const sorted = [...stores].sort((a, b) => a.price - b.price);
  const lowestCurrent = sorted[0]?.price;

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left p-3 text-sm font-medium">Tienda</th>
            <th className="text-right p-3 text-sm font-medium">Precio</th>
            <th className="text-center p-3 text-sm font-medium hidden sm:table-cell">
              Disponible
            </th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((store, i) => (
            <tr
              key={store.slug}
              className={`border-t ${i === 0 ? "bg-green-50" : ""}`}
            >
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{store.name}</span>
                  {i === 0 && (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 text-xs"
                    >
                      Mejor precio
                    </Badge>
                  )}
                </div>
              </td>
              <td className="p-3 text-right">
                <div className="flex flex-col items-end">
                  <span
                    className={`font-bold ${i === 0 ? "text-green-700" : ""}`}
                  >
                    ${store.price.toFixed(2)}
                  </span>
                  {store.originalPrice && (
                    <span className="text-xs text-muted-foreground line-through">
                      ${store.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              </td>
              <td className="p-3 text-center hidden sm:table-cell">
                {store.isAvailable ? (
                  <Check className="h-4 w-4 text-green-600 mx-auto" />
                ) : (
                  <X className="h-4 w-4 text-red-400 mx-auto" />
                )}
              </td>
              <td className="p-3 text-right">
                <a
                  href={store.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "outline", size: "sm" }) + " gap-1"}
                >
                  Ir a tienda
                  <ExternalLink className="h-3 w-3" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {lowestCurrent <= lowestPriceEver && (
        <div className="bg-green-50 border-t px-3 py-2 text-center text-sm font-medium text-green-700">
          Este es el precio más bajo registrado
        </div>
      )}
    </div>
  );
}
