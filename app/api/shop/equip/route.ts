/**
 * POST /api/shop/equip
 * Equip or unequip a cosmetic item.
 * Body: { username, cosmeticName, equipped: boolean }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const MAX_USERNAME_LENGTH = 50;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, cosmeticName, equipped } = body;

    if (!username || typeof username !== "string" || username.trim().length === 0) {
      return NextResponse.json({ error: "Username is required." }, { status: 400 });
    }
    if (username.trim().length > MAX_USERNAME_LENGTH) {
      return NextResponse.json({ error: `Username must be ${MAX_USERNAME_LENGTH} characters or fewer.` }, { status: 400 });
    }
    if (!cosmeticName || typeof cosmeticName !== "string" || cosmeticName.trim().length === 0) {
      return NextResponse.json({ error: "cosmeticName is required." }, { status: 400 });
    }
    if (typeof equipped !== "boolean") {
      return NextResponse.json({ error: "equipped must be a boolean." }, { status: 400 });
    }

    const sanitizedUsername = username.trim();

    const item = await prisma.cosmeticItem.findUnique({ where: { name: cosmeticName.trim() } });
    if (!item) {
      return NextResponse.json({ error: "Cosmetic item not found." }, { status: 404 });
    }

    // Verify user owns this item
    const ownership = await prisma.userCosmetic.findUnique({
      where: { username_cosmeticId: { username: sanitizedUsername, cosmeticId: item.id } },
    });
    if (!ownership) {
      return NextResponse.json({ error: "You do not own this item." }, { status: 403 });
    }

    if (equipped) {
      // Unequip any other item in the same category first
      const othersInCategory = await prisma.userCosmetic.findMany({
        where: { username: sanitizedUsername, equipped: true },
        include: { cosmetic: true },
      });

      const toUnequip = othersInCategory
        .filter((uc) => uc.cosmetic.category === item.category && uc.cosmeticId !== item.id)
        .map((uc) => uc.id);

      if (toUnequip.length > 0) {
        await prisma.userCosmetic.updateMany({
          where: { id: { in: toUnequip } },
          data: { equipped: false },
        });
      }
    }

    await prisma.userCosmetic.update({
      where: { username_cosmeticId: { username: sanitizedUsername, cosmeticId: item.id } },
      data: { equipped },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error equipping cosmetic:", error);
    return NextResponse.json({ error: "Failed to equip cosmetic." }, { status: 500 });
  }
}
