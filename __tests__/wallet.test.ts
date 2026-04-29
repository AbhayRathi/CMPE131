import { calculateReward, RewardInput } from "../lib/wallet";

describe("calculateReward", () => {
  const base: RewardInput = { wpm: 50, accuracy: 0.9, score: 100, rank: null, challengeMode: "off" };

  it("returns at least 1 credit", () => {
    expect(calculateReward({ ...base, score: 0, wpm: 0 })).toBeGreaterThanOrEqual(1);
  });

  it("calculates base credits from score * 0.1", () => {
    const credits = calculateReward({ ...base, accuracy: 0.5, wpm: 0, rank: null });
    // Base = round(100 * 0.1) = 10; accuracy < 0.85, no bonus; wpm < 40, no bonus
    expect(credits).toBe(10);
  });

  it("applies 1.5x accuracy bonus for >= 95% accuracy", () => {
    const credits = calculateReward({ ...base, accuracy: 0.95, wpm: 0, rank: null });
    // base = 10, * 1.5 = 15
    expect(credits).toBe(15);
  });

  it("applies 1.2x accuracy bonus for >= 85% accuracy", () => {
    const credits = calculateReward({ ...base, accuracy: 0.9, wpm: 0, rank: null });
    // base = 10, * 1.2 = 12
    expect(credits).toBe(12);
  });

  it("adds 20 credits for WPM >= 80", () => {
    const credits = calculateReward({ ...base, wpm: 80, accuracy: 0.5, rank: null });
    // base = 10, no accuracy bonus, + 20 wpm bonus = 30
    expect(credits).toBe(30);
  });

  it("adds 10 credits for WPM >= 60", () => {
    const credits = calculateReward({ ...base, wpm: 60, accuracy: 0.5, rank: null });
    expect(credits).toBe(20);
  });

  it("adds 5 credits for WPM >= 40", () => {
    const credits = calculateReward({ ...base, wpm: 40, accuracy: 0.5, rank: null });
    expect(credits).toBe(15);
  });

  it("adds 50 credits for rank 1", () => {
    const credits = calculateReward({ ...base, rank: 1, accuracy: 0.5, wpm: 0 });
    // base = 10, + 50 = 60
    expect(credits).toBe(60);
  });

  it("adds 30 credits for rank 2", () => {
    const credits = calculateReward({ ...base, rank: 2, accuracy: 0.5, wpm: 0 });
    expect(credits).toBe(40);
  });

  it("adds 20 credits for rank 3", () => {
    const credits = calculateReward({ ...base, rank: 3, accuracy: 0.5, wpm: 0 });
    expect(credits).toBe(30);
  });

  it("adds 10 credits for rank 4 or 5", () => {
    expect(calculateReward({ ...base, rank: 4, accuracy: 0.5, wpm: 0 })).toBe(20);
    expect(calculateReward({ ...base, rank: 5, accuracy: 0.5, wpm: 0 })).toBe(20);
  });

  it("adds 5 credits for rank 6-10", () => {
    expect(calculateReward({ ...base, rank: 6,  accuracy: 0.5, wpm: 0 })).toBe(15);
    expect(calculateReward({ ...base, rank: 10, accuracy: 0.5, wpm: 0 })).toBe(15);
  });

  it("applies 1.4x multiplier for challengeMode 'both'", () => {
    const credits = calculateReward({ ...base, accuracy: 0.5, wpm: 0, challengeMode: "both" });
    // base = 10, * 1.4 = 14
    expect(credits).toBe(14);
  });

  it("applies 1.2x multiplier for challengeMode 'move'", () => {
    const credits = calculateReward({ ...base, accuracy: 0.5, wpm: 0, challengeMode: "move" });
    expect(credits).toBe(12);
  });

  it("applies 1.2x multiplier for challengeMode 'resize'", () => {
    const credits = calculateReward({ ...base, accuracy: 0.5, wpm: 0, challengeMode: "resize" });
    expect(credits).toBe(12);
  });

  it("no challenge multiplier for 'off'", () => {
    const credits = calculateReward({ ...base, accuracy: 0.5, wpm: 0, challengeMode: "off" });
    expect(credits).toBe(10);
  });

  it("stacks all bonuses correctly", () => {
    const credits = calculateReward({ wpm: 80, accuracy: 0.97, score: 200, rank: 1, challengeMode: "both" });
    // base = round(200 * 0.1) = 20
    // accuracy >= 0.95: * 1.5 = 30
    // wpm >= 80: + 20 = 50
    // rank 1: + 50 = 100
    // challengeMode both: * 1.4 = 140
    expect(credits).toBe(140);
  });
});
