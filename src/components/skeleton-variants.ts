import { cva } from "class-variance-authority";

/**
 * Skeleton placeholder (cva). Exported on its own because not every loading
 * state is React: a view that builds HTML strings (the translator's result
 * board) takes the same classes from `skeletonVariants({ variant })`.
 *
 * - `text` — one line at the height of the surrounding text: the element is
 *   exactly one line box tall (`h-lh`) and paints a bar over its middle 60%
 *   (`bg-clip-content` + `py-[0.2lh]`). Stacked lines therefore take the same
 *   height as the text that replaces them — no layout shift, no gap utility
 *   needed. On an inline element wrapping real text, `text-transparent` hides
 *   the text and the bar follows its line breaks.
 * - `block` — a card-radius area (image, chart, panel); size it at the call site.
 * - `circle` — avatar or icon; give it a size (`size-10`).
 *
 * The pulse stops under `prefers-reduced-motion`.
 */
export const skeletonVariants = cva(
  "bg-surface-container-high text-transparent animate-pulse motion-reduce:animate-none",
  {
    variants: {
      variant: {
        text: "h-lh rounded-full bg-clip-content py-[0.2lh]",
        block: "rounded-xl",
        circle: "aspect-square shrink-0 rounded-full",
      },
    },
    defaultVariants: {
      variant: "text",
    },
  },
);
