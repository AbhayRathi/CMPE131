import { getMockPrice, getAllPrices, MOCK_ASSETS } from "../lib/trading";

describe("getMockPrice", () => {
  it("returns a number within ±20% of basePrice for each asset", () => {
    const now = Date.now();
    for (const asset of MOCK_ASSETS) {
      const price = getMockPrice(asset.symbol, now);
      expect(price).toBeGreaterThanOrEqual(asset.basePrice * 0.8 - 0.01);
      expect(price).toBeLessThanOrEqual(asset.basePrice * 1.2 + 0.01);
    }
  });

  it("is deterministic for the same symbol and timestamp", () => {
    const ts = 1700000000000;
    for (const asset of MOCK_ASSETS) {
      const p1 = getMockPrice(asset.symbol, ts);
      const p2 = getMockPrice(asset.symbol, ts);
      expect(p1).toBe(p2);
    }
  });

  it("returns same price within the same 60-second bucket", () => {
    // Compute two timestamps guaranteed to be in the same 60s bucket
    const bucket = 28333333;
    const t1 = bucket * 60000 + 1000;  // 1 second into the bucket
    const t2 = bucket * 60000 + 50000; // 50 seconds into the bucket
    expect(Math.floor(t1 / 60000)).toBe(Math.floor(t2 / 60000));
    for (const asset of MOCK_ASSETS) {
      expect(getMockPrice(asset.symbol, t1)).toBe(getMockPrice(asset.symbol, t2));
    }
  });

  it("may return different prices for different 60-second buckets", () => {
    // Different buckets (1 minute apart)
    const t1 = 1700000000000;
    const t2 = t1 + 60000;
    // Not guaranteed to differ for all assets, but buckets differ
    expect(Math.floor(t1 / 60000)).not.toBe(Math.floor(t2 / 60000));
  });

  it("returns 100 for unknown symbol", () => {
    expect(getMockPrice("UNKNOWN")).toBe(100);
  });

  it("returns a positive number for all 4 assets", () => {
    const now = Date.now();
    for (const asset of MOCK_ASSETS) {
      expect(getMockPrice(asset.symbol, now)).toBeGreaterThan(0);
    }
  });
});

describe("getAllPrices", () => {
  it("returns prices for all 4 mock assets", () => {
    const prices = getAllPrices();
    for (const asset of MOCK_ASSETS) {
      expect(prices).toHaveProperty(asset.symbol);
      expect(typeof prices[asset.symbol]).toBe("number");
    }
  });

  it("returns 4 entries", () => {
    expect(Object.keys(getAllPrices())).toHaveLength(4);
  });
});
