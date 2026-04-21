/**
 * GET /api/wallet?username=...
 * Returns the wallet balance and last 10 credit transactions for a user.
 * If the wallet doesn't exist, returns { balance: 0, transactions: [] }.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const MAX_USERNAME_LENGTH = 50;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username || typeof username !== "string" || username.trim().length === 0) {
      return NextResponse.json({ error: "Username is required." }, { status: 400 });
    }
    if (username.trim().length > MAX_USERNAME_LENGTH) {
      return NextResponse.json({ error: `Username must be ${MAX_USERNAME_LENGTH} characters or fewer.` }, { status: 400 });
    }

    const sanitized = username.trim();

    const wallet = await prisma.wallet.findUnique({
      where: { username: sanitized },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!wallet) {
      return NextResponse.json({ balance: 0, transactions: [] });
    }

    return NextResponse.json({
      balance: wallet.balance,
      transactions: wallet.transactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        reason: t.reason,
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching wallet:", error);
    return NextResponse.json({ error: "Failed to fetch wallet." }, { status: 500 });
  }
}
