import { cva } from "class-variance-authority";

/**
 * One row card of a side panel (SidebarCard). `shape` follows the app-wide
 * Style (useUiShape): `rounded` = card radius, `pill` = capsule with tighter
 * padding — and back to `rounded-2xl` once the card grows a meta line, as the
 * composer does when its text wraps.
 */
/**
 * The row geometry of every side-panel row — cards, and the user-menu trigger
 * under them — per shape, so their leading icons line up on one axis: 1px
 * border (transparent where a row draws none), this inset, then a 28px tile.
 *
 * Pill: the same 7px on every side, and the row's buttons are 28px circles
 * like the tile (see sidebarCardVariants). 1px border + 7px = 8px = the
 * capsule's end radius (44px row / 2 = 22) minus the tile's (14), so the icon
 * and the menu button sit concentric in the rounded ends.
 */
export const sidebarRowInset = {
  rounded: "gap-3 px-3 py-2.5",
  pill: "gap-2.5 p-[7px]",
} as const;

/**
 * The horizontal half of sidebarRowInset — for rows that set their own height
 * (SidebarAction) but must put their icon on the same axis as the cards'.
 */
export const sidebarRowInsetX = {
  rounded: "gap-3 px-3",
  pill: "gap-2.5 px-[7px]",
} as const;

export const sidebarCardVariants = cva(
  [
    "group/sidebar-card flex w-full min-w-0 items-center border text-left text-on-surface shadow-card transition-colors",
    "focus-within:outline-none",
  ],
  {
    variants: {
      shape: {
        rounded: `rounded-xl ${sidebarRowInset.rounded}`,
        // Direct-child buttons (menu, extras) as 28px circles, not 32px: the
        // row height then follows the tile, and the insets stay concentric.
        pill: `rounded-full has-[[data-slot=sidebar-card-meta]>*]:rounded-2xl ${sidebarRowInset.pill} [&>button:not([role=checkbox])]:size-7`,
      },
      state: {
        idle: "border-outline-variant bg-surface-container-lowest",
        active: "border-primary bg-primary/10",
      },
      // false = a display-only card (no onOpen): no pointer cursor, no hover fill.
      interactive: {
        true: "cursor-pointer",
        false: "cursor-default",
      },
    },
    compoundVariants: [{ state: "idle", interactive: true, class: "hover:bg-surface-container-high" }],
    defaultVariants: { shape: "rounded", state: "idle", interactive: true },
  },
);

/** The tinted icon tile at the start of a card (and in the rail). */
export const sidebarIconTileVariants = cva(
  "flex size-7 shrink-0 items-center justify-center bg-secondary-container text-[15px] leading-none text-primary [&>svg]:size-[18px]",
  {
    variants: {
      shape: { rounded: "rounded-[6px]", pill: "rounded-full" },
    },
    defaultVariants: { shape: "rounded" },
  },
);

/** Radius of the card's own icon buttons (menu, extra actions). */
export const sidebarControlShape = {
  rounded: "rounded-action",
  pill: "rounded-full",
} as const;
