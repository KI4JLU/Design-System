/**
 * A free colour (an admin-picked role or category colour, any CSS colour) as
 * the surface can show it: one too close to the card surface is inverted —
 * its OKLCH lightness mirrored, hue and chroma kept — so white turns black on
 * a light card and black turns white on a dark one. Every other colour stays
 * as it is. The limits are theme tokens (`--legible-flip-above`/`-below`,
 * tokens.css), so the same value flips per theme without JS. Pure CSS
 * (relative colour syntax), so it takes `var(...)` and `color-mix(...)` too.
 */
export function legibleColor(color: string): string {
  const flip =
    "(clamp(0, (l - var(--legible-flip-above, 0.9)) * 1000, 1) + clamp(0, (var(--legible-flip-below, -1) - l) * 1000, 1))";
  return `oklch(from ${color} calc(l + ${flip} * (1 - 2 * l)) c h / alpha)`;
}

/**
 * Black or white for a glyph on `color` as a background — the icon on a tile
 * in a role's colour, the check on a colour swatch. White while it reaches
 * 3:1 (WCAG non-text contrast, relative luminance below 0.3), so the system's
 * pink, blue and violet keep their white glyph; black on lighter colours
 * (teal, green, orange, yellow, cyan, pastels, white), where it reads 8:1+.
 */
export function onColor(color: string): string {
  // round(up, …) makes it discrete: 1 for any luminance below 0.3, 0 from it on, never a grey.
  const white = "round(up, clamp(0, 0.3 - (0.2126 * r + 0.7152 * g + 0.0722 * b), 1), 1)";
  return `color(from ${color} srgb-linear ${white} ${white} ${white} / 1)`;
}
