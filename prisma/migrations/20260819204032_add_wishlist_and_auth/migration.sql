-- DropIndex
DROP INDEX "idx_products_brand_trgm";

-- DropIndex
DROP INDEX "idx_products_name_trgm";

-- AlterTable
ALTER TABLE "price_alerts" ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "wishlists" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wishlists_userId_idx" ON "wishlists"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "wishlists_userId_productId_key" ON "wishlists"("userId", "productId");

-- CreateIndex
CREATE INDEX "price_alerts_userId_idx" ON "price_alerts"("userId");

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
