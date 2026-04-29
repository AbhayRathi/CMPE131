import { COSMETIC_CATALOG, CosmeticDef } from "../lib/shop";

describe("COSMETIC_CATALOG", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(COSMETIC_CATALOG)).toBe(true);
    expect(COSMETIC_CATALOG.length).toBeGreaterThan(0);
  });

  it("every item has required fields", () => {
    for (const item of COSMETIC_CATALOG) {
      expect(typeof item.name).toBe("string");
      expect(item.name.length).toBeGreaterThan(0);
      expect(["font", "theme", "avatar"]).toContain(item.category);
      expect(typeof item.description).toBe("string");
      expect(item.description.length).toBeGreaterThan(0);
      expect(typeof item.price).toBe("number");
      expect(typeof item.data).toBe("string");
    }
  });

  it("every item has a positive price", () => {
    for (const item of COSMETIC_CATALOG) {
      expect(item.price).toBeGreaterThan(0);
    }
  });

  it("all item names are unique", () => {
    const names = COSMETIC_CATALOG.map((i: CosmeticDef) => i.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it("data field is valid JSON", () => {
    for (const item of COSMETIC_CATALOG) {
      expect(() => JSON.parse(item.data)).not.toThrow();
    }
  });

  it("has items in each category", () => {
    const cats = COSMETIC_CATALOG.map((i) => i.category);
    expect(cats).toContain("font");
    expect(cats).toContain("theme");
    expect(cats).toContain("avatar");
  });
});
