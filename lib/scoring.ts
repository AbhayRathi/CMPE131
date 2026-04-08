/**
 * Scoring utilities for Aether Evo typing tests.
 * Handles WPM, accuracy, error count, score, and difficulty calculations.
 */

import { Difficulty } from "./prompts";

/**
 * Calculates Words Per Minute (WPM).
 * WPM = (correctChars / 5) / (durationSec / 60)
 * Returns 0 if duration is 0 or negative.
 */
export function calculateWPM(correctChars: number, durationSec: number): number {
  if (durationSec <= 0 || correctChars <= 0) return 0;
  const minutes = durationSec / 60;
  const words = correctChars / 5;
  return Math.round((words / minutes) * 100) / 100;
}

/**
 * Calculates accuracy as a ratio of correct characters to total characters typed.
 * Returns 0 if totalChars is 0.
 */
export function calculateAccuracy(correctChars: number, totalChars: number): number {
  if (totalChars <= 0) return 0;
  const accuracy = correctChars / totalChars;
  return Math.round(accuracy * 10000) / 10000; // 4 decimal precision
}

/**
 * Counts the number of errors by comparing typed text against the prompt.
 * Counts mismatches character by character, plus extra/missing characters.
 */
export function calculateErrors(prompt: string, typedText: string): number {
  let errors = 0;
  const minLen = Math.min(prompt.length, typedText.length);

  // Count character mismatches
  for (let i = 0; i < minLen; i++) {
    if (prompt[i] !== typedText[i]) {
      errors++;
    }
  }

  // Count extra or missing characters as errors
  errors += Math.abs(prompt.length - typedText.length);

  return errors;
}

/**
 * Counts the number of correct characters by comparing typed text against the prompt.
 */
export function countCorrectChars(prompt: string, typedText: string): number {
  let correct = 0;
  const minLen = Math.min(prompt.length, typedText.length);

  for (let i = 0; i < minLen; i++) {
    if (prompt[i] === typedText[i]) {
      correct++;
    }
  }

  return correct;
}

/**
 * Calculates the composite score.
 * Score = round(wpm * accuracy)
 */
export function calculateScore(wpm: number, accuracy: number): number {
  if (wpm <= 0 || accuracy <= 0) return 0;
  return Math.round(wpm * accuracy);
}

/**
 * Determines the next difficulty based on WPM and accuracy.
 * - Low accuracy (<0.8) or low WPM (<30) → easy
 * - Medium accuracy (0.8-0.95) and moderate WPM (30-60) → medium
 * - High accuracy (>0.95) and high WPM (>60) → hard
 */
export function determineDifficulty(wpm: number, accuracy: number): Difficulty {
  if (accuracy < 0.8 || wpm < 30) return "easy";
  if (accuracy >= 0.95 && wpm > 60) return "hard";
  return "medium";
}

/**
 * Computes all results from a typing test session.
 * Returns all metrics and the next difficulty level.
 */
export function computeResults(
  prompt: string,
  typedText: string,
  durationSec: number
): {
  wpm: number;
  accuracy: number;
  errorCount: number;
  score: number;
  nextDifficulty: Difficulty;
  correctChars: number;
} {
  const correctChars = countCorrectChars(prompt, typedText);
  const totalChars = typedText.length;
  const errorCount = calculateErrors(prompt, typedText);
  const wpm = calculateWPM(correctChars, durationSec);
  const accuracy = calculateAccuracy(correctChars, totalChars);
  const score = calculateScore(wpm, accuracy);
  const nextDifficulty = determineDifficulty(wpm, accuracy);

  return { wpm, accuracy, errorCount, score, nextDifficulty, correctChars };
}
