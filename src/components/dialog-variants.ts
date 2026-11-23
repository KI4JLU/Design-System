import { cva } from "class-variance-authority";

/**
 * DialogFooter layouts (cva). `end`: actions at their own width, right-aligned.
 * `fill`: a two-column row of equal halves; a lone action takes the right
 * one, where the primary action of a pair sits.
 */
export const dialogFooterVariants = cva("flex flex-col-reverse gap-2", {
  variants: {
    layout: {
      end: "sm:flex-row sm:justify-end",
      fill: "gap-3 sm:grid sm:grid-cols-2 [&>*]:w-full sm:[&>:only-child]:col-start-2",
    },
  },
  defaultVariants: {
    layout: "end",
  },
});
