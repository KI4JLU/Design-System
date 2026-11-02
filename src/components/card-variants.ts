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
 * The card's `style` with its accent colour as `--card-accent`, the custom
 * property `CardBand`, `CardHairline`, `accent` and `tint` read — through
 * `legibleColor`, so a colour that would vanish on the card (white on light,
 * black on dark) is inverted. `--card-on-accent` is black or white, whichever
 * reads on it (an icon tile in the card's colour). Without a colour both stay
 * unset and the parts fall back to neutral.
 */
export const cardAccentStyle = (
  accentColor: string | undefined,
  style?: React.CSSProperties,
): React.CSSProperties | undefined =>
  accentColor
    ? ({ ...style, "--card-accent": legibleColor(accentColor), "--card-on-accent": onColor("var(--card-accent)") } as React.CSSProperties)
    : style;

/**
 * The neutral rule colour — a hairline card without a colour of its own, a
 * list row without a category: the outline colour at 35 %, a quiet grey in
 * both themes. `CardHairline` falls back to it; pass it as `accentColor` for a
 * neutral `accent` edge.
 */
export const cardNeutralAccent = "color-mix(in oklab, var(--color-outline) 35%, transparent)";
