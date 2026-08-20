import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tiendas",
  description: "Tiendas de electrónica que comparamos en El Salvador.",
};

const stores = [
  {
    name: "Office Depot",
    slug: "office-depot",
    url: "https://www.officedepot.com.sv",
    description:
      "Tienda de tecnología y suministros de oficina con presencia en toda Centroamérica.",
    categories: ["Laptops", "Tablets", "Accesorios", "Impresoras"],
  },
  {
    name: "Siman",
    slug: "siman",
    url: "https://sv.siman.com",
    description:
      "Almacenes departamentales con amplia selección de electrónica y tecnología.",
    categories: ["Celulares", "Laptops", "TVs", "Audio", "Gaming"],
  },
  {
    name: "Omnisport",
    slug: "omnisport",
    url: "https://www.omnisport.com",
    description:
      "Cadena de tiendas con electrodomésticos, electrónica y muebles.",
    categories: ["TVs", "Celulares", "Audio", "Gaming"],
  },
  {
    name: "Aeon Computers",
    slug: "aeon",
    url: "https://aeon.com.sv",
    description:
      "Tienda especializada en computadoras, componentes y periféricos.",
    categories: ["Laptops", "Componentes", "Periféricos", "Gaming"],
  },
  {
    name: "Intelmax",
    slug: "intelmax",
    url: "https://tiendaintelmax.net",
    description:
      "Distribuidora de tecnología con amplio catálogo de componentes y equipos.",
    categories: ["Laptops", "Monitores", "Componentes", "Redes"],
  },
  {
    name: "RadioShack",
    slug: "radioshack",
    url: "https://www.radioshackla.com/elsalvador",
    description:
      "Tienda de electrónica de consumo, celulares y accesorios tecnológicos.",
    categories: ["Celulares", "Audio", "Gaming", "Accesorios"],
  },
  {
    name: "La Curacao",
    slug: "la-curacao",
    url: "https://www.lacuracao.com/sv",
    description:
      "Cadena centroamericana de electrodomésticos y electrónica con financiamiento.",
    categories: ["TVs", "Celulares", "Audio", "Laptops"],
  },
  {
    name: "Zona Digital",
    slug: "zona-digital",
    url: "https://zonadigitalsv.com",
    description:
      "Tienda en línea de tecnología con amplia variedad de celulares, laptops y accesorios.",
    categories: ["Celulares", "Laptops", "Audio", "Accesorios"],
  },
];

export default function StoresPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Tiendas</h1>
      <p className="text-muted-foreground mb-8">
        Comparamos precios de {stores.length} tiendas de electrónica en El
        Salvador.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map((store) => (
          <Card key={store.slug} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h2 className="font-bold text-lg">{store.name}</h2>
                <a
                  href={store.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {store.description}
              </p>
              <div className="flex flex-wrap gap-1">
                {store.categories.map((cat) => (
                  <Badge key={cat} variant="secondary" className="text-xs">
                    {cat}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
