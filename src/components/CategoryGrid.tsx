import Link from "next/link";
import {
  Smartphone,
  Laptop,
  Tablet,
  Tv,
  Headphones,
  Gamepad2,
  Mouse,
  Cpu,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Smartphone,
  Laptop,
  Tablet,
  Tv,
  Headphones,
  Gamepad2,
  Mouse,
  Cpu,
};

interface CategoryItem {
  name: string;
  slug: string;
  icon: string;
  count: number;
}

export function CategoryGrid({ categories }: { categories: CategoryItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {categories.map((cat) => {
        const Icon = iconMap[cat.icon] || Cpu;
        return (
          <Link
            key={cat.slug}
            href={`/categoria/${cat.slug}`}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-card hover:bg-primary/5 hover:border-primary/20 transition-colors group"
          >
            <Icon className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium text-center">{cat.name}</span>
            <span className="text-xs text-muted-foreground">
              {cat.count} productos
            </span>
          </Link>
        );
      })}
    </div>
  );
}
