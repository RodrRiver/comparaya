import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const products = await prisma.product.findMany({
    include: {
      storeProducts: {
        orderBy: { lastScrapedAt: "desc" },
        take: 1,
      },
    },
  });

  let updated = 0;
  for (const product of products) {
    const sp = product.storeProducts[0];
    if (!sp) continue;

    const newName = sp.storeProductName;
    if (!newName || newName === product.name) continue;

    await prisma.product.update({
      where: { id: product.id },
      data: { name: newName },
    });
    updated++;

    if (updated <= 10) {
      console.log(`  "${product.name}" → "${newName}"`);
    }
  }

  console.log(`\nUpdated ${updated} of ${products.length} product names`);
  await pool.end();
}

main().catch(console.error);
