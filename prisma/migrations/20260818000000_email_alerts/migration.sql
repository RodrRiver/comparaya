-- Drop wishlists, price_alerts (old), and users tables
DROP TABLE IF EXISTS "wishlists" CASCADE;
DROP TABLE IF EXISTS "price_alerts" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- Recreate price_alerts with email instead of userId
DROP TABLE IF EXISTS "price_alerts";
CREATE TABLE "price_alerts" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "targetPrice" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "price_alerts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "price_alerts_email_productId_key" ON "price_alerts"("email", "productId");
CREATE INDEX "price_alerts_isActive_idx" ON "price_alerts"("isActive");
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
