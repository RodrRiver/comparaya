// @ts-nocheck
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, productId, targetPrice, userId } = body;

    if (!email || !productId) {
      return NextResponse.json(
        { error: "Email y producto son requeridos" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    const prisma = getPrisma();

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    const existing = await prisma.priceAlert.findUnique({
      where: { email_productId: { email, productId } },
    });

    if (existing) {
      const updated = await prisma.priceAlert.update({
        where: { id: existing.id },
        data: {
          targetPrice: targetPrice || null,
          isActive: true,
        },
      });
      return NextResponse.json({ alert: updated, updated: true });
    }

    const alert = await prisma.priceAlert.create({
      data: {
        email,
        productId,
        targetPrice: targetPrice || null,
        userId: userId || null,
        isActive: true,
      },
    });

    return NextResponse.json({ alert, created: true });
  } catch (err) {
    console.error("Alert creation error:", err);
    return NextResponse.json(
      { error: "Error al crear la alerta" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const productId = searchParams.get("productId");

    if (!email || !productId) {
      return NextResponse.json({ error: "Parámetros requeridos" }, { status: 400 });
    }

    const prisma = getPrisma();

    await prisma.priceAlert.updateMany({
      where: { email, productId: parseInt(productId), isActive: true },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
