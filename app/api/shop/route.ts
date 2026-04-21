/**
 * GET /api/shop?username=...
 * Returns all cosmetic items with owned/equipped status for the given user.
 * If username is omitted, all items are returned as unowned.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { COSMETIC_CATALOG } from "@/lib/shop";

const MAX_USERNAME_LENGTH = 50;

/** Ensure all catalog items are present in DB (idempotent seed). */
async function seedCatalog() {
  for (const item of COSMETIC_CATALOG) {
    await prisma.cosmeticItem.upsert({
      where: { name: item.name },
      update: { category: item.category, description: item.description, price: item.price, data: item.data },
      create: item,
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    await seedCatalog();

    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    const sanitized = username && username.trim().length > 0 && username.trim().length <= MAX_USERNAME_LENGTH
      ? username.trim()
      : null;

    const items = await prisma.cosmeticItem.findMany({ orderBy: { price: "asc" } });

    let ownedSet: Map<string, boolean> = new Map();
    if (sanitized) {
      const owned = await prisma.userCosmetic.findMany({ where: { username: sanitized } });
      ownedSet = new Map(owned.map((uc) => [uc.cosmeticId, uc.equipped]));
    }

    const result = items.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      description: item.description,
      price: item.price,
      owned: ownedSet.has(item.id),
      equipped: ownedSet.get(item.id) ?? false,
    }));

    return NextResponse.json({ items: result });
  } catch (error) {
    console.error("Error fetching shop:", error);
    return NextResponse.json({ error: "Failed to fetch shop." }, { status: 500 });
  }
}
