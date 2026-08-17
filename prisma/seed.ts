import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const stores = [
    {
      name: "Office Depot",
      slug: "office-depot",
      websiteUrl: "https://www.officedepot.com.sv",
      logoUrl: "/stores/office-depot.png",
    },
    {
      name: "Siman",
      slug: "siman",
      websiteUrl: "https://sv.siman.com",
      logoUrl: "/stores/siman.png",
    },
    {
      name: "Omnisport",
      slug: "omnisport",
      websiteUrl: "https://www.omnisport.com",
      logoUrl: "/stores/omnisport.png",
    },
    {
      name: "Aeon Computers",
      slug: "aeon",
      websiteUrl: "https://aeon.com.sv",
      logoUrl: "/stores/aeon.png",
    },
    {
      name: "Intelmax",
      slug: "intelmax",
      websiteUrl: "https://tiendaintelmax.net",
      logoUrl: "/stores/intelmax.png",
    },
    {
      name: "RadioShack",
      slug: "radioshack",
      websiteUrl: "https://www.radioshackla.com/elsalvador",
      logoUrl: "/stores/radioshack.png",
    },
    {
      name: "La Curacao",
      slug: "la-curacao",
      websiteUrl: "https://www.lacuracao.com/sv",
      logoUrl: "/stores/la-curacao.png",
    },
  ];

  const categories = [
    { name: "Celulares", slug: "celulares", icon: "Smartphone" },
    { name: "Laptops", slug: "laptops", icon: "Laptop" },
    { name: "Tablets", slug: "tablets", icon: "Tablet" },
    { name: "Televisores", slug: "televisores", icon: "Tv" },
    { name: "Audio", slug: "audio", icon: "Headphones" },
    { name: "Gaming", slug: "gaming", icon: "Gamepad2" },
    { name: "Accesorios", slug: "accesorios", icon: "Mouse" },
    { name: "Componentes", slug: "componentes", icon: "Cpu" },
  ];

  for (const store of stores) {
    await prisma.store.upsert({
      where: { slug: store.slug },
      update: store,
      create: store,
    });
  }

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  console.log("Seed completed: 7 stores, 8 categories");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
