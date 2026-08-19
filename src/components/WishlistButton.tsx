"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";

export function WishlistButton({ productId }: { productId: number }) {
  const { user, signIn } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setSaved(false);
      return;
    }
    fetch(`/api/wishlist?userId=${user.uid}`)
      .then((r) => r.json())
      .then((data) => {
        setSaved(data.productIds?.includes(productId) || false);
      })
      .catch(() => {});
  }, [user, productId]);

  async function toggle() {
    if (!user) {
      await signIn();
      return;
    }

    setLoading(true);
    if (saved) {
      await fetch(`/api/wishlist?userId=${user.uid}&productId=${productId}`, {
        method: "DELETE",
      });
      setSaved(false);
    } else {
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, productId }),
      });
      setSaved(true);
    }
    setLoading(false);
  }

  return (
    <Button
      variant="outline"
      className={`gap-2 ${saved ? "text-red-500 border-red-200 bg-red-50 hover:bg-red-100" : ""}`}
      onClick={toggle}
      disabled={loading}
    >
      <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
      {saved ? "Guardado" : "Guardar"}
    </Button>
  );
}
