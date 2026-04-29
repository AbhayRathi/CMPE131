/**
 * GET /api/portfolio?username=...
 * Returns holdings, current prices, unrealized P&L, and available credits.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAllPrices } from "@/lib/trading";

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
    const prices = getAllPrices();

    const [wallet, holdings] = await Promise.all([
      prisma.wallet.findUnique({ where: { username: sanitized } }),
      prisma.portfolioHolding.findMany({ where: { username: sanitized } }),
    ]);

    const availableCredits = wallet?.balance ?? 0;

    const holdingsWithPnl = holdings.map((h) => {
      const currentPrice = prices[h.symbol] ?? 0;
      const currentValue = currentPrice * h.quantity;
      const costBasis    = h.avgBuyPrice * h.quantity;
      const unrealizedPnl = currentValue - costBasis;
      return {
        symbol: h.symbol,
        quantity: h.quantity,
        avgBuyPrice: h.avgBuyPrice,
        currentPrice,
        currentValue: Math.round(currentValue * 100) / 100,
        unrealizedPnl: Math.round(unrealizedPnl * 100) / 100,
      };
    });

    const totalValue = holdingsWithPnl.reduce((sum, h) => sum + h.currentValue, 0);

    return NextResponse.json({
      holdings: holdingsWithPnl,
      prices,
      totalValue: Math.round(totalValue * 100) / 100,
      availableCredits,
    });
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    return NextResponse.json({ error: "Failed to fetch portfolio." }, { status: 500 });
  }
}
