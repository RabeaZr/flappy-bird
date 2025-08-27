import { selectStarTier } from "./spawn";

describe("selectStarTier", () => {
  test("before 50: only 1-pt stars", () => {
    for (let i = 0; i < 10; i++) {
      const tier = selectStarTier(0, i / 10);
      expect(tier.value).toBe(1);
      expect(tier.key).toBe("star1");
    }
  });

  test("50..99: allows 1 or 2", () => {
    const values = new Set();
    for (let i = 0; i < 20; i++) {
      values.add(selectStarTier(60, i / 20).value);
    }
    expect(values.has(1)).toBe(true);
    expect(values.has(2)).toBe(true);
    expect(values.has(3)).toBe(false);
  });

  test("100+: allows 1, 2, or 3", () => {
    const values = new Set();
    for (let i = 0; i < 30; i++) {
      values.add(selectStarTier(120, i / 30).value);
    }
    expect(values.has(1)).toBe(true);
    expect(values.has(2)).toBe(true);
    expect(values.has(3)).toBe(true);
  });
});
