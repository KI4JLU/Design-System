import { cva } from "class-variance-authority";

/**
 * The row geometry of every side-panel row — cards, the primary action above
 * them and the user-menu trigger below them — so their leading icons line up
 * on one axis: a 10px side inset, then the icon slot (`sidebarIconTileVariants`).
 */
export const sidebarRowInset = "gap-2.5 px-2.5 py-2";

/**
 * The horizontal half of sidebarRowInset — for rows that set their own height
 * (SidebarAction, the cards) but must put their icon on the same axis.
 */
export const sidebarRowInsetX = "gap-2.5 px-2.5";

/**
 * One row of a side panel (SidebarCard): a flat 36px row — no border, no
 * shadow — on the row radius, a quiet fill on hover. A card that grows a meta
 * line grows with it. The ⋯ menu shows on hover, on keyboard focus inside the
 * row and while it is open (see SidebarCard).
 */
export const sidebarCardVariants = cva(
  [
    "group/sidebar-card flex min-h-9 w-full min-w-0 items-center gap-2.5 rounded-[var(--ui-radius-row)] py-1 pr-1 pl-2.5 text-left text-on-surface transition-colors",
    "focus-within:outline-none",
  ],
  {
    variants: {
      state: {
        idle: "",
        active: "bg-primary/10",
        // Ticked in a delete selection (SidebarCard selectionTone="destructive").
        marked: "bg-error/10",
      },
      // false = a display-only card (no onOpen): no pointer cursor, no hover fill.
      // An openable card is ONE pointer target: its own buttons (title, ⋯,
      // extras, checkbox) take the pointer too, or the cursor flips between
      // hand and arrow as it crosses the title — buttons default to the arrow.
      interactive: {
        true: "cursor-pointer [&_button:not(:disabled)]:cursor-pointer",
        false: "cursor-default",
      },
    },
    // An idle row keeps the hover fill while its ⋯ menu is open (the pointer
    // has moved into the menu), so the row the menu belongs to stays marked —
    // grey, never the primary tint an active row has.
    compoundVariants: [
      { state: "idle", interactive: true, class: "hover:bg-surface-container-low" },
      { state: "idle", class: "has-[>button[data-state=open]]:bg-surface-container-low" },
    ],
    defaultVariants: { state: "idle", interactive: true },
  },
);

/**
 * The leading slot of a card: a quiet 16px glyph in the secondary text
 * colour, or — with `iconText` — a grey type badge (`PDF`, `DOCX`) of 30 × 20.
 */
export const sidebarIconTileVariants = cva(
  "flex shrink-0 items-center justify-center leading-none text-on-surface-variant",
  {
    variants: {
      kind: {
        icon: "size-4 text-[14px] in-data-[icon-slot=badge]:w-[30px] [&>svg]:size-4",
        text: "h-5 w-[30px] rounded-[var(--ui-radius-tile)] bg-surface-container text-[9px] font-semibold tracking-[0.02em]",
      },
    },
    defaultVariants: { kind: "icon" },
  },
);
