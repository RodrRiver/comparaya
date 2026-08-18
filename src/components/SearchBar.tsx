"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto px-2 sm:px-0">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar productos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-12 pr-14 sm:pr-28 h-12 sm:h-14 text-sm sm:text-base rounded-full border-2 focus-visible:border-primary"
        />
        <Button
          type="submit"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full sm:hidden h-8 w-8"
        >
          <Search className="h-4 w-4" />
        </Button>
        <Button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-6 hidden sm:inline-flex"
        >
          Buscar
        </Button>
      </div>
    </form>
  );
}
