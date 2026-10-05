import { cva } from "class-variance-authority";

/**
 * FormActionBar frame (cva). A raised card surface (`rounded-xl`, border, like
 * `Card`) that is also a size container (`@container`), so its inner layout
 * switches on the bar's own width — a bar in a narrow column stacks its
 * actions even on a wide screen.
 *
 * `sticky` pins it to the bottom of the nearest scroll container, 16px
 * (`stack-md`) above the edge, `z-10` over the content scrolling beneath it;
 * it then floats, so it takes the overlay elevation. Static it is a plain
 * card row with the card elevation.
 */
export const formActionBarVariants = cva(
  "@container rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md text-on-surface",
  {
    variants: {
      sticky: {
        true: "sticky bottom-stack-md z-10 shadow-overlay",
        false: "shadow-card",
      },
    },
    defaultVariants: { sticky: true },
  },
);
