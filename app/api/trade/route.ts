/**
 * POST /api/trade
 * Executes a buy or sell order for a mock asset.
 * Body: { username, symbol, type: "buy"|"sell", quantity }
 * Price is always fetched server-side — never trusted from client.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMockPrice, MOCK_ASSETS } from "@/lib/trading";

const MAX_USERNAME_LENGTH = 50;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, symbol, type, quantity } = body;

    // --- Input validation ---
    if (!username || typeof username !== "string" || username.trim().length === 0) {
      return NextResponse.json({ error: "Username is required." }, { status: 400 });
    }
    if (username.trim().length > MAX_USERNAME_LENGTH) {
      return NextResponse.json({ error: `Username must be ${MAX_USERNAME_LENGTH} characters or fewer.` }, { status: 400 });
    }

    const validSymbols = MOCK_ASSETS.map(a => a.symbol);
    if (!symbol || !validSymbols.includes(symbol)) {
      return NextResponse.json({ error: `Symbol must be one of: ${validSymbols.join(", ")}.` }, { status: 400 });
    }

    if (type !== "buy" && type !== "sell") {
      return NextResponse.json({ error: 'Type must be "buy" or "sell".' }, { status: 400 });
    }

    if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({ error: "Quantity must be a positive number." }, { status: 400 });
    }

    const sanitizedUsername = username.trim();

    // Fetch server-side price (never trust client)
    const price = getMockPrice(symbol);
    const total = Math.round(price * quantity);

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

    if (type === "buy") {
      if (wallet.balance < total) {
        return NextResponse.json({ error: "Insufficient credits." }, { status: 400 });
      }

      // Deduct credits
      const updatedWallet = await prisma.wallet.update({
        where: { username: sanitizedUsername },
        data: { balance: { decrement: total } },
      });

      // Upsert holding with updated average buy price
      const existing = await prisma.portfolioHolding.findUnique({
        where: { username_symbol: { username: sanitizedUsername, symbol } },
      });

      let newAvgBuyPrice: number;
      let newQuantity: number;

      if (existing) {
        const oldCost  = existing.avgBuyPrice * existing.quantity;
        const newCost  = price * quantity;
        newQuantity    = existing.quantity + quantity;
        newAvgBuyPrice = (oldCost + newCost) / newQuantity;
      } else {
        newQuantity    = quantity;
        newAvgBuyPrice = price;
      }

      const holding = await prisma.portfolioHolding.upsert({
        where: { username_symbol: { username: sanitizedUsername, symbol } },
        update: { quantity: newQuantity, avgBuyPrice: newAvgBuyPrice },
        create: { username: sanitizedUsername, symbol, quantity: newQuantity, avgBuyPrice: newAvgBuyPrice },
      });

      await prisma.trade.create({
        data: { username: sanitizedUsername, symbol, type: "buy", quantity, price, total },
      });

      return NextResponse.json({
        newBalance: updatedWallet.balance,
        holding: { symbol: holding.symbol, quantity: holding.quantity, avgBuyPrice: holding.avgBuyPrice },
      });
    } else {
      // Sell path
      const existing = await prisma.portfolioHolding.findUnique({
        where: { username_symbol: { username: sanitizedUsername, symbol } },
      });

      if (!existing || existing.quantity < quantity) {
        return NextResponse.json({ error: "Insufficient holdings to sell." }, { status: 400 });
      }

      // Add credits
      const updatedWallet = await prisma.wallet.update({
        where: { username: sanitizedUsername },
        data: { balance: { increment: total } },
      });

      const newQuantity = existing.quantity - quantity;

      const holding = await prisma.portfolioHolding.update({
        where: { username_symbol: { username: sanitizedUsername, symbol } },
        data: { quantity: newQuantity },
      });

      await prisma.trade.create({
        data: { username: sanitizedUsername, symbol, type: "sell", quantity, price, total },
      });

      return NextResponse.json({
        newBalance: updatedWallet.balance,
        holding: { symbol: holding.symbol, quantity: holding.quantity, avgBuyPrice: holding.avgBuyPrice },
      });
    }
  } catch (error) {
    console.error("Error processing trade:", error);
    return NextResponse.json({ error: "Failed to process trade." }, { status: 500 });
  }
}
