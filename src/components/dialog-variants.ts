import { cva } from "class-variance-authority";

/**
 * DialogContent frame (cva). `size` picks the max width; `default` is the
 * original `max-w-lg`. The frame is capped at the viewport height; a taller
 * dialog scrolls as a whole.
 *
 * Without a `DialogBody` the frame is the original grid, so existing layouts
 * (`grid-cols-2`, `self-*` on children) render as before. With a `DialogBody`
 * it becomes a flex column: only the body scrolls (it is the one part allowed
 * to shrink, `min-h-0`) while header and footer stay in view.
 */
export const dialogContentVariants = cva(
  [
    "fixed left-1/2 top-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-full -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto",
    "has-[[data-slot=dialog-body]]:flex has-[[data-slot=dialog-body]]:flex-col",
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
