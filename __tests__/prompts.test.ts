/**
 * Tests for Aether Evo prompt utilities.
 * Covers prompt selection, difficulty validation, and fallback behavior.
 */

import { getPrompt, getPromptsByDifficulty, isValidDifficulty, Difficulty } from "@/lib/prompts";

describe("getPrompt", () => {
  it("should return a non-empty string for easy difficulty", () => {
    const prompt = getPrompt("easy");
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("should return a non-empty string for medium difficulty", () => {
    const prompt = getPrompt("medium");
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("should return a non-empty string for hard difficulty", () => {
    const prompt = getPrompt("hard");
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("should default to easy when no difficulty is provided", () => {
    const prompt = getPrompt();
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("should fallback to easy for invalid difficulty", () => {
    // Using type assertion to test runtime fallback behavior
    const prompt = getPrompt("invalid" as Difficulty);
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });
});

describe("getPromptsByDifficulty", () => {
  it("should return an array of prompts for each difficulty", () => {
    const difficulties: Difficulty[] = ["easy", "medium", "hard"];
    for (const diff of difficulties) {
      const prompts = getPromptsByDifficulty(diff);
      expect(Array.isArray(prompts)).toBe(true);
      expect(prompts.length).toBeGreaterThan(0);
      prompts.forEach((p) => {
        expect(typeof p).toBe("string");
        expect(p.length).toBeGreaterThan(0);
      });
    }
  });

  it("should return easy prompts for invalid difficulty", () => {
    const prompts = getPromptsByDifficulty("invalid" as Difficulty);
    const easyPrompts = getPromptsByDifficulty("easy");
    expect(prompts).toEqual(easyPrompts);
  });
});

describe("isValidDifficulty", () => {
  it("should return true for valid difficulties", () => {
    expect(isValidDifficulty("easy")).toBe(true);
    expect(isValidDifficulty("medium")).toBe(true);
    expect(isValidDifficulty("hard")).toBe(true);
  });

  it("should return false for invalid difficulties", () => {
    expect(isValidDifficulty("")).toBe(false);
    expect(isValidDifficulty("extreme")).toBe(false);
    expect(isValidDifficulty("EASY")).toBe(false);
    expect(isValidDifficulty("123")).toBe(false);
  });
});
