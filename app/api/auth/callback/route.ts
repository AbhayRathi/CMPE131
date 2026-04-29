import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeResults } from "@/lib/scoring";
import { isValidDifficulty } from "@/lib/prompts";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!code || !stateParam) {
    return NextResponse.redirect(`${appUrl}/?error=auth_failed`);
  }

  // Exchange code for access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${appUrl}/api/auth/callback`,
    }),
  });

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  if (!accessToken) {
    return NextResponse.redirect(`${appUrl}/?error=auth_failed`);
  }

  // Fetch GitHub username
  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const userData = await userRes.json();
  const username: string = userData.login;

  if (!username) {
    return NextResponse.redirect(`${appUrl}/?error=auth_failed`);
  }

  // Decode game data from state param
  let gameData: {
    prompt: string;
    typedText: string;
    durationSec: number;
    difficulty: string;
  };
  try {
    gameData = JSON.parse(
      Buffer.from(stateParam, "base64").toString("utf8")
    );
  } catch {
    return NextResponse.redirect(`${appUrl}/?error=invalid_state`);
  }

  const { prompt, typedText, durationSec, difficulty } = gameData;
  const validDifficulty = isValidDifficulty(difficulty) ? difficulty : "easy";
  const results = computeResults(prompt, typedText || " ", durationSec);

  await prisma.user.upsert({
    where: { username },
    update: {},
    create: { username },
  });

  await prisma.testSession.create({
    data: {
      username,
      prompt,
      typedText: typedText.slice(0, 5000),
      durationSec,
      wpm: results.wpm,
      accuracy: results.accuracy,
      errorCount: results.errorCount,
      score: results.score,
      difficulty: validDifficulty,
    },
  });

  const resultParams = new URLSearchParams({
    wpm: String(results.wpm),
    accuracy: String(results.accuracy),
    errorCount: String(results.errorCount),
    score: String(results.score),
    nextDifficulty: results.nextDifficulty,
    username,
  });

  return NextResponse.redirect(`${appUrl}/?${resultParams}`);
}
