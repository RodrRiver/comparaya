"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Menu, X, TrendingDown, Heart, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

const categories = [
  { name: "Celulares", slug: "celulares" },
  { name: "Laptops", slug: "laptops" },
  { name: "Tablets", slug: "tablets" },
  { name: "Televisores", slug: "televisores" },
  { name: "Audio", slug: "audio" },
  { name: "Gaming", slug: "gaming" },
];

export function Navbar() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { user, signIn, signOut, loading } = useAuth();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl shrink-0">
          <TrendingDown className="h-6 w-6 text-primary" />
          <span>
            Compara<span className="text-primary">Ya</span>
          </span>
        </Link>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>
        </form>

        <nav className="hidden md:flex items-center gap-1">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/categoria/${cat.slug}`}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary"
            >
              {cat.name}
            </Link>
          ))}
        </nav>

        <Link
          href="/wishlist"
          className="hidden md:flex items-center gap-1 px-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Heart className="h-4 w-4" />
        </Link>

        {!loading && (
          <div className="hidden md:flex items-center">
            {user ? (
              <div className="flex items-center gap-2">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt=""
                    className="h-7 w-7 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                )}
                <Button variant="ghost" size="sm" onClick={signOut} className="text-xs text-muted-foreground">
                  <LogOut className="h-3.5 w-3.5 mr-1" />
                  Salir
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={signIn} className="gap-1.5 text-xs">
                <LogIn className="h-3.5 w-3.5" />
                Iniciar sesión
              </Button>
            )}
          </div>
        )}

        <Sheet>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" className="md:hidden" />}
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <div className="flex flex-col gap-4 mt-8">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar productos..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </form>
              <nav className="flex flex-col gap-1">
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/categoria/${cat.slug}`}
                    className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary"
                  >
                    {cat.name}
                  </Link>
                ))}
              </nav>
              <Link href="/tiendas" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                Tiendas
              </Link>
              <Link href="/wishlist" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Wishlist
              </Link>
              {!loading && (
                <div className="px-3 py-2">
                  {user ? (
                    <div className="flex items-center gap-3">
                      {user.photoURL && (
                        <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={signOut}>
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={signIn} className="w-full gap-2">
                      <LogIn className="h-4 w-4" />
                      Iniciar sesión
                    </Button>
                  )}
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
