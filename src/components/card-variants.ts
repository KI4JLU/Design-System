import type * as React from "react";
import { legibleColor, onColor } from "../lib/legible-color";

/**
 * Shared by `Card` and `SelectableCard`. Kept in its own module (see
 * button-variants.ts) so both files can import it without tripping
 * react-refresh's "only export components" rule.
 */

/**
 * The surface every card shares. `group/card` lets the parts read the card. A
 * hairline card (one with a `CardBand`) becomes a flex column, so its footer
 * can sit at the bottom; any other card keeps the layout its call site gives it.
 */
export const cardSurfaceClassName =
  "group/card rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface shadow-card has-[>[data-slot=card-band]]:flex has-[>[data-slot=card-band]]:flex-col";

/**
 * The light a card's colour casts (`CardBand`'s glow, `CardHairline`'s halo):
 * the colour lifted to at least mid lightness (OKLCH L ≥ 0.64) and a little
 * more saturated, hue kept. A dark colour (navy) does not glow; its lighter
 * self does. Pure CSS (relative colour syntax), like `legibleColor`.
 */
export const cardGlowColor = (color: string): string =>
  `oklch(from ${color} calc(max(l, 0.6) + 0.04) calc(c * 1.2) h / alpha)`;

/**
 * The card's `style` with its accent colour as `--card-accent`, the custom
 * property `CardBand`, `CardHairline`, `accent` and `tint` read — through
 * `legibleColor`, so a colour that would vanish on the card (white on light,
 * black on dark) is inverted. `--card-on-accent` is black or white, whichever
 * reads on it (an icon tile in the card's colour); `--card-glow` is the light
 * it casts (`cardGlowColor`). Without a colour all three stay unset and the
 * parts fall back to neutral.
 */
export const cardAccentStyle = (
  accentColor: string | undefined,
  style?: React.CSSProperties,
): React.CSSProperties | undefined =>
  accentColor
    ? ({
        ...style,
        "--card-accent": legibleColor(accentColor),
        "--card-on-accent": onColor("var(--card-accent)"),
        "--card-glow": cardGlowColor("var(--card-accent)"),
      } as React.CSSProperties)
    : style;

/**
 * The neutral accent — a list row without a category: the outline colour at
 * 35 %, a quiet grey in both themes. Pass it as `accentColor` for a neutral
 * `accent` edge. (A hairline card without a colour draws its rule in the
 * card's border colour instead, see `CardHairline`.)
 */
export const cardNeutralAccent = "color-mix(in oklab, var(--color-outline) 35%, transparent)";
