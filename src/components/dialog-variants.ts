import { cva } from "class-variance-authority";

/**
 * DialogContent frame (cva). `size` picks the max width; `default` is the
 * original `max-w-lg`. The frame is a flex column capped at the viewport
 * height: a dialog that fits looks as before, a taller one scrolls as a whole
 * — or, with a `DialogBody`, only the body scrolls while header and footer
 * stay in view (the body is the one part allowed to shrink, `min-h-0`).
 *
 * Flex rather than the former grid also keeps an unbreakable child (a long
 * name) inside the dialog: a grid's implicit column grew to fit it.
 */
export const dialogContentVariants = cva(
  [
    "fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-full -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto",
    "rounded-xl border border-outline-variant bg-surface-container-lowest p-6 text-on-surface shadow-modal",
    "focus:outline-none",
  ],
  {
    variants: {
      size: {
        /** 384px — a short confirmation. */
        sm: "max-w-sm",
        /** 512px — the original width. */
        default: "max-w-lg",
        /** 672px — a form with two columns, a list with long names. */
        lg: "max-w-2xl",
        /** 768px — a library or table to choose from. */
        xl: "max-w-3xl",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);
