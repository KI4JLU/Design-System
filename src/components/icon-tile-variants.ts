import { cva } from "class-variance-authority";
import { badgeFilledTones } from "./badge-variants";

/**
 * IconTile style variants (cva).
 *
 * `tone`: `primary` (the primary container), `neutral`, `solid` (the solid
 * primary) and `accent` (the colour of the card it sits on, `--card-accent`,
 * see `cardAccentStyle`; its glyph black or white, whichever reads) are the
 * tile's own. `tint` and the status tones (`success`, `warning`, `caution`,
 * `error`, `info`) are Badge's `filled` tones (`badgeFilledTones`), so a tile
 * and a badge of one tone always match — `tint` is Badge's `primary`, the
 * accent's light tint.
 *
 * `size`: `sm` 28px, `md` 36px (the tile radius), `lg` 40px (rounded like a
 * card's corner, the media of an Item), `xl` 48px.
 */
export const iconTileVariants = cva(
  "inline-flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        primary: "bg-primary-container text-on-primary-container",
        neutral: "bg-surface-container-high text-on-surface-variant",
        solid: "bg-primary text-on-primary",
        accent: "bg-[var(--card-accent,var(--color-primary))] text-[var(--card-on-accent,var(--color-on-primary))]",
        tint: badgeFilledTones.primary,
        success: badgeFilledTones.success,
        warning: badgeFilledTones.warning,
        caution: badgeFilledTones.caution,
        error: badgeFilledTones.error,
        info: badgeFilledTones.info,
      },
      size: {
        sm: "size-7 rounded-[var(--ui-radius-tile)] [&_svg]:size-4",
        md: "size-9 rounded-[var(--ui-radius-tile)] [&_svg]:size-[18px]",
        lg: "size-10 rounded-xl [&_svg]:size-5",
        xl: "size-12 rounded-xl [&_svg]:size-6",
      },
    },
    defaultVariants: {
      tone: "primary",
      size: "md",
    },
  },
);
