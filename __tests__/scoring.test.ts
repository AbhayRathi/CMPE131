/**
 * Tests for Aether Evo scoring utilities.
 * Covers WPM, accuracy, error count, score, and difficulty calculations.
 */

import {
  calculateWPM,
  calculateAccuracy,
  calculateErrors,
  countCorrectChars,
  calculateScore,
  determineDifficulty,
  computeResults,
} from "@/lib/scoring";

describe("calculateWPM", () => {
  it("should calculate WPM correctly for standard input", () => {
    // 50 correct chars / 5 = 10 words, in 60 seconds = 10 WPM
    expect(calculateWPM(50, 60)).toBe(10);
  });

  it("should calculate WPM for 30-second test", () => {
    // 50 correct chars / 5 = 10 words, in 30 seconds = 20 WPM
    expect(calculateWPM(50, 30)).toBe(20);
  });

  it("should return 0 when duration is 0", () => {
    expect(calculateWPM(100, 0)).toBe(0);
  });

  it("should return 0 when duration is negative", () => {
    expect(calculateWPM(100, -5)).toBe(0);
  });

  it("should return 0 when correctChars is 0", () => {
    expect(calculateWPM(0, 60)).toBe(0);
  });

  it("should return 0 when correctChars is negative", () => {
    expect(calculateWPM(-10, 60)).toBe(0);
  });

  it("should handle large WPM values", () => {
    // 500 correct chars / 5 = 100 words, in 60s = 100 WPM
    expect(calculateWPM(500, 60)).toBe(100);
  });
});

describe("calculateAccuracy", () => {
  it("should return 1.0 for perfect accuracy", () => {
    expect(calculateAccuracy(100, 100)).toBe(1);
  });

  it("should return 0.5 for half accuracy", () => {
    expect(calculateAccuracy(50, 100)).toBe(0.5);
  });

  it("should return 0 when totalChars is 0", () => {
    expect(calculateAccuracy(0, 0)).toBe(0);
  });

  it("should return 0 when totalChars is negative", () => {
    expect(calculateAccuracy(10, -5)).toBe(0);
  });

  it("should handle small accuracy values", () => {
    expect(calculateAccuracy(1, 100)).toBe(0.01);
  });

  it("should round to 4 decimal places", () => {
    // 1/3 = 0.3333...
    expect(calculateAccuracy(1, 3)).toBe(0.3333);
  });
});

describe("calculateErrors", () => {
  it("should return 0 for identical strings", () => {
    expect(calculateErrors("hello", "hello")).toBe(0);
  });

  it("should count character mismatches", () => {
    expect(calculateErrors("hello", "hxllo")).toBe(1);
  });

  it("should count multiple errors", () => {
    expect(calculateErrors("hello", "xxxxx")).toBe(5);
  });

  it("should count extra typed characters as errors", () => {
    expect(calculateErrors("hi", "hiii")).toBe(2);
  });

  it("should count missing characters as errors", () => {
    expect(calculateErrors("hello", "hel")).toBe(2);
  });

  it("should handle empty typed text", () => {
    expect(calculateErrors("hello", "")).toBe(5);
  });

  it("should handle empty prompt", () => {
    expect(calculateErrors("", "hello")).toBe(5);
  });

  it("should handle both empty strings", () => {
    expect(calculateErrors("", "")).toBe(0);
  });
});

describe("countCorrectChars", () => {
  it("should count all correct for identical strings", () => {
    expect(countCorrectChars("hello", "hello")).toBe(5);
  });

  it("should count partial correct chars", () => {
    expect(countCorrectChars("hello", "hxllo")).toBe(4);
  });

  it("should return 0 for completely wrong input", () => {
    expect(countCorrectChars("hello", "xxxxx")).toBe(0);
  });

  it("should handle shorter typed text", () => {
    expect(countCorrectChars("hello", "hel")).toBe(3);
  });

  it("should handle empty strings", () => {
    expect(countCorrectChars("", "")).toBe(0);
  });
});

describe("calculateScore", () => {
  it("should calculate score as wpm * accuracy rounded", () => {
    expect(calculateScore(60, 0.95)).toBe(57);
  });

  it("should return 0 for zero WPM", () => {
    expect(calculateScore(0, 0.95)).toBe(0);
  });

  it("should return 0 for zero accuracy", () => {
    expect(calculateScore(60, 0)).toBe(0);
  });

  it("should return 0 for negative values", () => {
    expect(calculateScore(-10, 0.95)).toBe(0);
  });

  it("should round correctly", () => {
    // 45 * 0.88 = 39.6 → rounds to 40
    expect(calculateScore(45, 0.88)).toBe(40);
  });
});

describe("determineDifficulty", () => {
  it("should return easy for low accuracy", () => {
    expect(determineDifficulty(50, 0.7)).toBe("easy");
  });

  it("should return easy for low WPM", () => {
    expect(determineDifficulty(20, 0.9)).toBe("easy");
  });

  it("should return medium for moderate performance", () => {
    expect(determineDifficulty(45, 0.88)).toBe("medium");
  });

  it("should return hard for high performance", () => {
    expect(determineDifficulty(70, 0.96)).toBe("hard");
  });

  it("should return easy when both are very low", () => {
    expect(determineDifficulty(10, 0.5)).toBe("easy");
  });

  it("should return medium when WPM is high but accuracy is moderate", () => {
    expect(determineDifficulty(80, 0.85)).toBe("medium");
  });

  it("should return easy when WPM is 0", () => {
    expect(determineDifficulty(0, 1.0)).toBe("easy");
  });
});

describe("computeResults", () => {
  it("should compute all results for a standard test", () => {
    const prompt = "hello world";
    const typed = "hello world";
    const duration = 60;

    const result = computeResults(prompt, typed, duration);

    expect(result.correctChars).toBe(11);
    expect(result.errorCount).toBe(0);
    expect(result.accuracy).toBe(1);
    expect(result.wpm).toBeGreaterThan(0);
    expect(result.score).toBeGreaterThan(0);
  });

  it("should handle partial errors", () => {
    const prompt = "hello world";
    const typed = "hellx world";
    const duration = 60;

    const result = computeResults(prompt, typed, duration);

    expect(result.correctChars).toBe(10);
    expect(result.errorCount).toBe(1);
    expect(result.accuracy).toBeLessThan(1);
  });

  it("should handle empty typed text gracefully", () => {
    const prompt = "hello world";
    const typed = " "; // minimum valid input
    const duration = 30;

    const result = computeResults(prompt, typed, duration);

    expect(result.errorCount).toBeGreaterThan(0);
    expect(result.wpm).toBe(0);
  });
});
