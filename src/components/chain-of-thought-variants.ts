import { cva } from "class-variance-authority";

/**
 * `ChainOfThoughtStep` row by `status`. The label carries the status in its
 * text colour: `active` in the strong text colour, `complete` and `pending`
 * muted. AI Elements dims `pending` text to `muted-foreground/50`, which on
 * these tokens is about 2.4:1 — below WCAG AA for 14px text — so here only
 * the step's icon dims for `pending` (`chainOfThoughtStepIconVariants`),
 * the label stays readable.
 */
export const chainOfThoughtStepVariants = cva("flex gap-2 text-sm", {
  variants: {
    status: {
      complete: "text-on-surface-variant",
      active: "text-on-surface",
      pending: "text-on-surface-variant",
    },
  },
  defaultVariants: { status: "complete" },
});

/** The step icon by `status`: `pending` in the quiet `outline` colour, the others inherit the row's. */
export const chainOfThoughtStepIconVariants = cva("size-4", {
  variants: {
    status: {
      complete: "",
      active: "",
      pending: "text-outline",
    },
  },
  defaultVariants: { status: "complete" },
});
