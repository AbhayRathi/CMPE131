/**
 * Wallet utilities — credit reward calculation for Aether Evo.
 */

export interface RewardInput {
  wpm: number;
  accuracy: number; // 0-1
  score: number;
  rank: number | null; // leaderboard rank (1-based), null if not in top 10
  challengeMode: "off" | "move" | "resize" | "both";
}

export function calculateReward(input: RewardInput): number {
  const { wpm, accuracy, score, rank, challengeMode } = input;

  // Base: score * 0.1, min 1
  let credits = Math.max(1, Math.round(score * 0.1));

  // Accuracy bonus: >95% → 1.5x, >85% → 1.2x
  if (accuracy >= 0.95) credits = Math.round(credits * 1.5);
  else if (accuracy >= 0.85) credits = Math.round(credits * 1.2);

  // WPM bonus
  if (wpm >= 80) credits += 20;
  else if (wpm >= 60) credits += 10;
  else if (wpm >= 40) credits += 5;

  // Rank bonus
  if (rank === 1) credits += 50;
  else if (rank === 2) credits += 30;
  else if (rank === 3) credits += 20;
  else if (rank !== null && rank <= 5) credits += 10;
  else if (rank !== null && rank <= 10) credits += 5;

  // Challenge mode bonus
  if (challengeMode === "both") credits = Math.round(credits * 1.4);
  else if (challengeMode !== "off") credits = Math.round(credits * 1.2);

  return credits;
}
