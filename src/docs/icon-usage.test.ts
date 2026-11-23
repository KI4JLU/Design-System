import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as lucide from "lucide-react";
import { ICON_DICTIONARY } from "./icon-dictionary";
import { ICON_REGISTRY } from "./icon-registry";
import iconUsage from "./icon-usage.json";

/*
 * `Foundations/Icons` draws its inventory from icon-usage.json, which
 * scripts/icon-usage.mjs writes. Oracle: the components' own source, read
 * here independently of the script — a component that starts or stops
 * drawing an icon fails this until the script is run again.
 */

const COMPONENTS = "src/components";
const canonical = new Map<unknown, string>(Object.entries(lucide.icons).map(([name, glyph]) => [glyph, name]));

function drawnByComponents(): Record<string, string[]> {
  const ds: Record<string, Set<string>> = {};
  for (const file of readdirSync(COMPONENTS)) {
    if (!/\.tsx?$/.test(file) || /\.(test|stories)\.tsx?$/.test(file)) continue;
    const source = readFileSync(join(COMPONENTS, file), "utf8");
    for (const match of source.matchAll(/import\s*\{([^}]*)\}\s*from\s*["']lucide-react["']/g)) {
      for (const part of match[1].split(",")) {
        const name = part.trim().split(/\s+as\s+/)[0].trim();
        const glyph = canonical.get((lucide as unknown as Record<string, unknown>)[name]);
        if (glyph) (ds[glyph] ??= new Set()).add(file.replace(/\.tsx?$/, ""));
      }
    }
  }
  return Object.fromEntries(Object.keys(ds).sort().map((glyph) => [glyph, [...ds[glyph]].sort()]));
}

describe("icon-usage.json (run `node scripts/icon-usage.mjs` when this fails)", () => {
  it("lists exactly the icons the DS components draw, and where", () => {
    expect(iconUsage.ds).toEqual(drawnByComponents());
  });

  it("has a registry entry for every glyph it lists, under its current name", () => {
    const listed = new Set([...Object.keys(iconUsage.ds), ...Object.keys(iconUsage.justrag.icons)]);
    expect(Object.keys(ICON_REGISTRY).sort()).toEqual([...listed].sort());
    for (const [name, glyph] of Object.entries(ICON_REGISTRY)) expect(canonical.get(glyph)).toBe(name);
  });
});

describe("the icon dictionary", () => {
  const named = new Set(ICON_DICTIONARY.flatMap((g) => g.entries.flatMap((e) => e.icons)));

  it("gives every icon in use a meaning", () => {
    const withoutRow = Object.keys(ICON_REGISTRY).filter((name) => !named.has(name));
    expect(withoutRow, "add these to icon-dictionary.ts").toEqual([]);
  });

  it("names only icons in use, by their current name (or the Spinner component)", () => {
    const unknown = [...named].filter((name) => name !== "Spinner" && !(name in ICON_REGISTRY));
    expect(unknown).toEqual([]);
  });
});
