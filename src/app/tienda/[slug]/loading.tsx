import { Card, CardContent } from "@/components/ui/card";

function SkeletonCard() {
  return (
    <Card className="overflow-hidden h-full">
      <div className="aspect-square bg-muted animate-pulse" />
      <CardContent className="p-2.5 sm:p-4 space-y-2">
        <div className="h-3 w-16 bg-muted animate-pulse rounded" />
        <div className="h-4 w-full bg-muted animate-pulse rounded" />
        <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
        <div className="h-5 w-20 bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  );
}

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="h-9 w-48 bg-muted animate-pulse rounded mb-2" />
      <div className="h-5 w-64 bg-muted animate-pulse rounded mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
