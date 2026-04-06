/**
 * GET /api/leaderboard
 * Returns top 10 test sessions sorted by score (descending).
 * Queries directly from test_sessions table — no separate leaderboard table.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const topSessions = await prisma.testSession.findMany({
      orderBy: { score: "desc" },
      take: 10,
      select: {
        id: true,
        username: true,
        wpm: true,
        accuracy: true,
        errorCount: true,
        score: true,
        difficulty: true,
        durationSec: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ leaderboard: topSessions });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard." },
      { status: 500 }
    );
  }
}
