import { legibleColor } from "./legible-color";

/**
 * The palette's light-theme hues, slot 1 first — the values of
 * `--p-category-N` in tokens.css (keep the two in step; a test compares
 * them). For a colour picker's starting value when a category has only a
 * slot; drawing goes through the tokens, which dim in dark mode.
 */
export const CATEGORY_PALETTE = [
  "#ee4589", "#15b99c", "#92d32b", "#f48b16", "#facf37", "#3897e8", "#30b9f6", "#b46ef7", "#31c4cb",
] as const;

/**
 * The system's colours a free colour is picked from (`ColorField`): the brand
 * blue (`--p-blue-700`, primary) and the category palette's hues, as `#RRGGBB`.
 */
export const COLOR_PRESETS: readonly string[] = ["#0056B3", ...CATEGORY_PALETTE.map((c) => c.toUpperCase())];

/** Number of hues in the category palette (`--color-category-1..N`). */
export const CATEGORY_COLOR_COUNT = CATEGORY_PALETTE.length;

/**
 * A stable palette colour for a category: the same key always maps to the same
 * `var(--color-category-N)`, so a category keeps its colour when others are
 * added or removed (an index into the list would shift). FNV-1a over the key.
 */
export function categoryColor(key: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `var(--color-category-${((h >>> 0) % CATEGORY_COLOR_COUNT) + 1})`;
}

/**
 * A category's own colour (any CSS colour, e.g. an admin-picked hex) as the
 * palette's tokens draw theirs: as is in light mode, dimmed toward the card
 * surface in dark mode (`--category-strength`, tokens.css), and inverted first
 * when it would vanish on the surface (`legibleColor`). Use it wherever a
 * free colour stands in for `var(--color-category-N)`.
 */
export function categoryTone(color: string): string {
  return `color-mix(in oklab, ${legibleColor(color)} var(--category-strength, 100%), var(--color-surface-container-lowest))`;
}
