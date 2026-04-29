/**
 * Prisma seed script — populates the cosmetic_items catalog.
 * Run with: npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";
import { COSMETIC_CATALOG } from "../lib/shop";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding cosmetic catalog…");
  for (const item of COSMETIC_CATALOG) {
    await prisma.cosmeticItem.upsert({
      where: { name: item.name },
      update: {
        category: item.category,
        description: item.description,
        price: item.price,
        data: item.data,
      },
      create: {
        name: item.name,
        category: item.category,
        description: item.description,
        price: item.price,
        data: item.data,
      },
    });
  }
  console.log(`Seeded ${COSMETIC_CATALOG.length} cosmetic items.`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
