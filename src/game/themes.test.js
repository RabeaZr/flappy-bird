import { THEMES, themeForScore } from "./themes";

describe("themes", () => {
  test("has 10 themes", () => {
    expect(THEMES.length).toBe(10);
  });

  test("theme changes every 25 points and clamps at last", () => {
    expect(themeForScore(0)).toBe(THEMES[0]);
    expect(themeForScore(24)).toBe(THEMES[0]);
    expect(themeForScore(25)).toBe(THEMES[1]);
    expect(themeForScore(249)).toBe(THEMES[9]); // 9 * 25 = 225.. stays last
    expect(themeForScore(5000)).toBe(THEMES[9]); // never loops back
  });
});
