/**
 * POST /api/wallet/award
 * Awards credits to a user's wallet after a typing test.
 * Body: { username, wpm, accuracy, score, rank, challengeMode, sessionId }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateReward } from "@/lib/wallet";

const MAX_USERNAME_LENGTH = 50;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, wpm, accuracy, score, rank, challengeMode, sessionId } = body;

    // --- Input validation ---
    if (!username || typeof username !== "string" || username.trim().length === 0) {
      return NextResponse.json({ error: "Username is required." }, { status: 400 });
    }
    if (username.trim().length > MAX_USERNAME_LENGTH) {
      return NextResponse.json({ error: `Username must be ${MAX_USERNAME_LENGTH} characters or fewer.` }, { status: 400 });
    }

    if (typeof wpm !== "number" || !Number.isFinite(wpm) || wpm < 0) {
      return NextResponse.json({ error: "Invalid wpm value." }, { status: 400 });
    }
    if (typeof accuracy !== "number" || !Number.isFinite(accuracy) || accuracy < 0 || accuracy > 1) {
      return NextResponse.json({ error: "accuracy must be a number between 0 and 1." }, { status: 400 });
    }
    if (typeof score !== "number" || !Number.isFinite(score) || score < 0) {
      return NextResponse.json({ error: "Invalid score value." }, { status: 400 });
    }
    if (rank !== null && (typeof rank !== "number" || !Number.isInteger(rank) || rank < 1)) {
      return NextResponse.json({ error: "rank must be a positive integer or null." }, { status: 400 });
    }

    const validChallengeModes = ["off", "move", "resize", "both"] as const;
    if (!validChallengeModes.includes(challengeMode)) {
      return NextResponse.json({ error: "Invalid challengeMode value." }, { status: 400 });
    }

    const sanitizedUsername = username.trim();
    const sanitizedSessionId = sessionId && typeof sessionId === "string" ? sessionId.trim() : null;

    // --- Guard against double-awarding the same session ---
    if (sanitizedSessionId) {
      const existing = await prisma.creditTransaction.findUnique({
        where: { sessionId: sanitizedSessionId },
      });
      if (existing) {
        return NextResponse.json({ error: "Already awarded for this session." }, { status: 409 });
      }
    }

    const credits = calculateReward({ wpm, accuracy, score, rank, challengeMode });

    // Ensure user exists before upserting wallet
    await prisma.user.upsert({
      where: { username: sanitizedUsername },
      update: {},
      create: { username: sanitizedUsername },
    });

    // Upsert wallet and increment balance atomically
    const wallet = await prisma.wallet.upsert({
      where: { username: sanitizedUsername },
      update: { balance: { increment: credits } },
      create: { username: sanitizedUsername, balance: credits },
    });

    // Record transaction (sessionId stored for idempotency)
    const reason = sanitizedSessionId
      ? `Typing test reward (session: ${sanitizedSessionId.slice(0, 30)})`
      : "Typing test reward";

    await prisma.creditTransaction.create({
      data: {
        username: sanitizedUsername,
        amount: credits,
        reason,
        ...(sanitizedSessionId ? { sessionId: sanitizedSessionId } : {}),
      },
    });

    return NextResponse.json({ credits, newBalance: wallet.balance });
  } catch (error) {
    console.error("Error awarding credits:", error);
    return NextResponse.json({ error: "Failed to award credits." }, { status: 500 });
  }
}
