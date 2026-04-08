/**
 * POST /api/submit
 * Accepts typing test results, computes metrics, stores in database,
 * and returns computed results with next difficulty.
 *
 * Body: { username, prompt, typedText, durationSec, difficulty }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeResults } from "@/lib/scoring";
import { isValidDifficulty } from "@/lib/prompts";

/** Maximum allowed length for typed text to prevent abuse */
const MAX_TYPED_TEXT_LENGTH = 5000;
/** Maximum allowed length for username */
const MAX_USERNAME_LENGTH = 50;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, prompt, typedText, durationSec, difficulty } = body;

    // --- Input validation ---
    if (!username || typeof username !== "string" || username.trim().length === 0) {
      return NextResponse.json(
        { error: "Username is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    if (username.trim().length > MAX_USERNAME_LENGTH) {
      return NextResponse.json(
        { error: `Username must be ${MAX_USERNAME_LENGTH} characters or fewer.` },
        { status: 400 }
      );
    }

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    if (!typedText || typeof typedText !== "string" || typedText.trim().length === 0) {
      return NextResponse.json(
        { error: "Typed text is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    if (typedText.length > MAX_TYPED_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Typed text must be ${MAX_TYPED_TEXT_LENGTH} characters or fewer.` },
        { status: 400 }
      );
    }

    if (
      typeof durationSec !== "number" ||
      !Number.isFinite(durationSec) ||
      durationSec <= 0 ||
      durationSec > 300
    ) {
      return NextResponse.json(
        { error: "Duration must be a positive number (max 300 seconds)." },
        { status: 400 }
      );
    }

    const validDifficulty = isValidDifficulty(difficulty || "") ? difficulty : "easy";

    // --- Compute results ---
    const results = computeResults(prompt, typedText, durationSec);

    // --- Ensure user exists (upsert for guest support) ---
    const sanitizedUsername = username.trim().slice(0, MAX_USERNAME_LENGTH);

    await prisma.user.upsert({
      where: { username: sanitizedUsername },
      update: {},
      create: { username: sanitizedUsername },
    });

    // --- Store test session ---
    const session = await prisma.testSession.create({
      data: {
        username: sanitizedUsername,
        prompt,
        typedText: typedText.slice(0, MAX_TYPED_TEXT_LENGTH),
        durationSec,
        wpm: results.wpm,
        accuracy: results.accuracy,
        errorCount: results.errorCount,
        score: results.score,
        difficulty: validDifficulty,
      },
    });

    return NextResponse.json({
      id: session.id,
      wpm: results.wpm,
      accuracy: results.accuracy,
      errorCount: results.errorCount,
      score: results.score,
      nextDifficulty: results.nextDifficulty,
    });
  } catch (error) {
    console.error("Error submitting results:", error);
    return NextResponse.json(
      { error: "Failed to submit results. Please try again." },
      { status: 500 }
    );
  }
}
