/**
 * GET /api/prompt
 * Returns a typing prompt based on the requested difficulty level.
 * Query params: ?difficulty=easy|medium|hard (defaults to "easy")
 */

import { NextRequest, NextResponse } from "next/server";
import { getPrompt, isValidDifficulty, Difficulty } from "@/lib/prompts";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const difficultyParam = searchParams.get("difficulty") || "easy";

    // Validate difficulty parameter
    const difficulty: Difficulty = isValidDifficulty(difficultyParam)
      ? difficultyParam
      : "easy";

    const prompt = getPrompt(difficulty);

    return NextResponse.json({
      prompt,
      difficulty,
    });
  } catch (error) {
    console.error("Error fetching prompt:", error);
    // Fallback: always return something
    return NextResponse.json({
      prompt: "The quick brown fox jumps over the lazy dog.",
      difficulty: "easy" as Difficulty,
    });
  }
}
