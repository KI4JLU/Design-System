import { cva } from "class-variance-authority";

/**
 * DescriptionList layouts (cva). `stacked`: term above its value, items in a
 * column. `inline`: a two-column grid, terms left, values right; the term
 * column takes the widest term up to 40% of the width (terms wrap anywhere,
 * so a long compound cannot widen it past the cap). Each `DescriptionItem`
 * joins that grid through `subgrid`, so its `dt`/`dd` line up with every other
 * item's; a second `dd` for the same term stays in the value column.
 */
export const descriptionListVariants = cva("m-0 p-0", {
  variants: {
    layout: {
      stacked: "flex flex-col gap-stack-md",
      inline:
        "grid grid-cols-[fit-content(40%)_minmax(0,1fr)] items-baseline gap-x-stack-md gap-y-stack-sm [&>dt]:col-start-1 [&>dd]:col-start-2",
    },
  },
  defaultVariants: { layout: "stacked" },
});

export const descriptionItemVariants = cva("", {
  variants: {
    layout: {
      stacked: "flex flex-col gap-1",
      inline:
        "col-span-full grid grid-cols-subgrid items-baseline gap-y-1 [&>dt]:col-start-1 [&>dd]:col-start-2",
    },
  },
  defaultVariants: { layout: "stacked" },
});
