import { cva } from "class-variance-authority";

/**
 * EmptyState style variants (cva), one map per part so the two sizes stay in
 * one place. `default` is the page/card block; `compact` fits a table's empty
 * row, a popover or a dashboard tile.
 */
export const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center",
  {
    variants: {
      size: {
        default: "gap-stack-md px-6 py-10",
        compact: "gap-2 p-4",
      },
    },
    defaultVariants: { size: "default" },
  },
);

/** The muted round tile behind the icon. */
export const emptyStateIconVariants = cva(
  "flex shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant [&_svg]:shrink-0",
  {
    variants: {
      size: {
        default: "size-12 [&_svg]:size-6",
        compact: "size-8 [&_svg]:size-4",
      },
    },
    defaultVariants: { size: "default" },
  },
);

export const emptyStateTitleVariants = cva("m-0 text-on-surface", {
  variants: {
    size: {
      default: "font-headline-md text-headline-md-mobile",
      compact: "text-sm font-semibold",
    },
  },
  defaultVariants: { size: "default" },
});

export const emptyStateDescriptionVariants = cva("m-0 text-on-surface-variant", {
  variants: {
    size: {
      default: "max-w-md text-sm",
      compact: "text-sm",
    },
  },
  defaultVariants: { size: "default" },
});
