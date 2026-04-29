/**
 * POST /api/shop/buy
 * Purchase a cosmetic item.
 * Body: { username, cosmeticName }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const MAX_USERNAME_LENGTH = 50;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, cosmeticName } = body;

    if (!username || typeof username !== "string" || username.trim().length === 0) {
      return NextResponse.json({ error: "Username is required." }, { status: 400 });
    }
    if (username.trim().length > MAX_USERNAME_LENGTH) {
      return NextResponse.json({ error: `Username must be ${MAX_USERNAME_LENGTH} characters or fewer.` }, { status: 400 });
    }
    if (!cosmeticName || typeof cosmeticName !== "string" || cosmeticName.trim().length === 0) {
      return NextResponse.json({ error: "cosmeticName is required." }, { status: 400 });
    }

    const sanitizedUsername = username.trim();

    const item = await prisma.cosmeticItem.findUnique({ where: { name: cosmeticName.trim() } });
    if (!item) {
      return NextResponse.json({ error: "Cosmetic item not found." }, { status: 404 });
    }

    // Check already owned
    const existing = await prisma.userCosmetic.findUnique({
      where: { username_cosmeticId: { username: sanitizedUsername, cosmeticId: item.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "You already own this item." }, { status: 400 });
    }

    // Ensure user + wallet exist
    await prisma.user.upsert({
      where: { username: sanitizedUsername },
      update: {},
      create: { username: sanitizedUsername },
    });

    const wallet = await prisma.wallet.upsert({
      where: { username: sanitizedUsername },
      update: {},
      create: { username: sanitizedUsername, balance: 0 },
    });

    if (wallet.balance < item.price) {
      return NextResponse.json({ error: "Insufficient credits." }, { status: 400 });
    }

    // Deduct and create ownership record + transaction
    const [updatedWallet] = await Promise.all([
      prisma.wallet.update({
        where: { username: sanitizedUsername },
        data: { balance: { decrement: item.price } },
      }),
      prisma.userCosmetic.create({
        data: { username: sanitizedUsername, cosmeticId: item.id, equipped: false },
      }),
      prisma.creditTransaction.create({
        data: { username: sanitizedUsername, amount: -item.price, reason: `Purchased cosmetic: ${item.name}` },
      }),
    ]);

    return NextResponse.json({ success: true, newBalance: updatedWallet.balance });
  } catch (error) {
    console.error("Error purchasing cosmetic:", error);
    return NextResponse.json({ error: "Failed to purchase cosmetic." }, { status: 500 });
  }
}
