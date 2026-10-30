import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CATEGORY_COLOR_COUNT, CATEGORY_PALETTE, categoryColor, categoryTone } from "./category-color";

describe("categoryColor", () => {
  it("is stable per key", () => {
    expect(categoryColor("lehre")).toBe(categoryColor("lehre"));
  });

  it("always names a palette token", () => {
    for (const key of ["", "a", "Lehre", "3f1c2e8a-uuid", "Forschung & Transfer"]) {
      const m = categoryColor(key).match(/^var\(--color-category-(\d+)\)$/);
      expect(m).not.toBeNull();
      const n = Number(m![1]);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(CATEGORY_COLOR_COUNT);
    }
  });

  it("spreads keys over several hues", () => {
    const hues = new Set(Array.from({ length: 40 }, (_, i) => categoryColor(`cat-${i}`)));
    expect(hues.size).toBeGreaterThan(5);
  });
});

// Oracle: tokens.css — a free colour dims exactly like the palette, through
// --category-strength toward the card surface.
describe("categoryTone", () => {
  it("mixes the colour toward the card surface at the category strength", () => {
    expect(categoryTone("#d4380d")).toBe(
      "color-mix(in oklab, #d4380d var(--category-strength, 100%), var(--color-surface-container-lowest))",
    );
  });
});

// Oracle: tokens.css itself — the exported palette is the --p-category-N values.
describe("CATEGORY_PALETTE", () => {
  it("matches the --p-category tokens", () => {
    // Read from disk: the unit project compiles no CSS, so a `?raw` import is empty.
    const css = readFileSync(resolve(process.cwd(), "src/tokens.css"), "utf8");
    const tokens = [...css.matchAll(/--p-category-(\d+): (#[0-9a-f]{6});/g)].map((m) => m[2]);
    expect(tokens).toEqual([...CATEGORY_PALETTE]);
    expect(CATEGORY_COLOR_COUNT).toBe(tokens.length);
  });
});
