"use client";

import { useState } from "react";
import { Bell, Check, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/AuthProvider";

export function AlertForm({
  productId,
  productName,
  currentPrice,
}: {
  productId: number;
  productName: string;
  currentPrice: number;
}) {
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);

  const effectiveEmail = user?.email || email;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: effectiveEmail,
          productId,
          targetPrice: targetPrice ? parseFloat(targetPrice) : null,
          userId: user?.uid || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Error al crear la alerta");
        return;
      }

      setStatus("success");
      setMessage(
        targetPrice
          ? `Te notificaremos a ${effectiveEmail} cuando baje de $${targetPrice}`
          : `Te notificaremos a ${effectiveEmail} cuando baje el precio`
      );
    } catch {
      setStatus("error");
      setMessage("Error de conexión");
    }
  }

  async function handleClick() {
    if (!user) {
      await signIn();
      return;
    }
    setOpen(true);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {user ? (
        <DialogTrigger render={<Button className="gap-2" />}>
          <Bell className="h-4 w-4" />
          Crear alerta de precio
        </DialogTrigger>
      ) : (
        <Button className="gap-2" onClick={handleClick}>
          <Bell className="h-4 w-4" />
          Crear alerta de precio
        </Button>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alerta de precio</DialogTitle>
          <DialogDescription>
            Recibe un correo cuando baje el precio de {productName}. Precio
            actual: ${currentPrice.toFixed(2)}.
          </DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm text-center text-muted-foreground">
              {message}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {user ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                {user.photoURL && (
                  <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" />
                )}
                <div>
                  <p className="text-sm font-medium">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="alert-email">Correo electrónico</Label>
                <Input
                  id="alert-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <Label htmlFor="alert-price">
                Precio objetivo (opcional)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="alert-price"
                  type="number"
                  step="0.01"
                  min="0"
                  max={currentPrice}
                  placeholder={`Ej: ${(currentPrice * 0.8).toFixed(2)}`}
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Deja vacío para recibir alerta ante cualquier baja de precio.
              </p>
            </div>

            {status === "error" && (
              <p className="text-sm text-red-500">{message}</p>
            )}

            <Button type="submit" className="w-full gap-2" disabled={status === "loading"}>
              {status === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
              Activar alerta
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
