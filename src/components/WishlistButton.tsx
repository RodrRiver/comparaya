"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "comparaya-wishlist";

function getWishlist(): number[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function setWishlist(ids: number[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function WishlistButton({ productId }: { productId: number }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(getWishlist().includes(productId));
  }, [productId]);

  function toggle() {
    const list = getWishlist();
    if (list.includes(productId)) {
      setWishlist(list.filter((id) => id !== productId));
      setSaved(false);
    } else {
      setWishlist([...list, productId]);
      setSaved(true);
    }
  }

  return (
    <Button
      variant="outline"
      className={`gap-2 ${saved ? "text-red-500 border-red-200 bg-red-50 hover:bg-red-100" : ""}`}
      onClick={toggle}
    >
      <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
      {saved ? "Guardado" : "Guardar"}
    </Button>
  );
}
