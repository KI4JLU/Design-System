import { cva } from "class-variance-authority";

/**
 * Width of the collapsed rail, in px.
 *
 * **Design constant, deliberately not a prop.** The expanded `width` is
 * consumer state (the user drags it, the app persists it), so it is a prop;
 * the rail is a fixed piece of chrome — it holds exactly one icon button and a
 * narrow preview strip, so a consumer choosing its own value could only make
 * it too small for the touch target or wide enough to look like a broken
 * panel. It is exported so a composing template can compute a grid/offset
 * from the same number instead of restating it.
 *
 * 60px matches `BottomTabBar`'s height, so collapsed rail and mobile bar read
 * as one chrome unit. It is a plain constant rather than a `--spacing-*` token
 * because it is consumed as a number (inline `style` width, next to the
 * consumer's px width) — a token would have to be re-read from CSS to be used
 * in the same expression.
 *
 * Not the AppShell header's `h-14` (56px): the rail is a width, the bar a
 * height, and the two need not agree.
 */
export const SIDE_PANEL_RAIL_WIDTH = 60;

/**
 * SidePanel frame variants (cva). `side` picks the border edge: the pane's
 * border sits on the edge that faces the content, so a left pane draws
 * `border-r` and a right pane `border-l`. Each pane therefore draws exactly
 * one line and `ResizeHandle` draws none — that is what removes the
 * double-1px-line problem (and the negative margins that hid it) from the
 * consumer.
 *
 * No width transition, deliberately: the same width is also driven by a
 * pointer drag, and an animated width lags the pointer.
 */
export const sidePanelVariants = cva(
  "flex h-full shrink-0 flex-col overflow-hidden bg-sidebar",
  {
    variants: {
      side: {
        left: "border-r border-outline-variant",
        right: "border-l border-outline-variant",
      },
    },
    defaultVariants: {
      side: "left",
    },
  },
);
