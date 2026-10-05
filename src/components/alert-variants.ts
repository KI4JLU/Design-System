import { cva } from "class-variance-authority";

/**
 * Status vocabulary of an alert — the same set `Toast` speaks: what a message
 * reports, never a brand accent (so no primary/secondary like `Badge`).
 */
export type AlertTone = "neutral" | "info" | "success" | "warning" | "error";

/**
 * Alert surface (cva). Each tone is its `*-container` / `on-*-container` pair
 * (the fills `Badge`'s `filled` appearance uses), so text and icon keep their
 * contrast in both themes; `neutral` takes Badge's neutral fill with full
 * `on-surface` text, since an alert carries sentences, not a two-word label.
 *
 * The 1px border is transparent on purpose: invisible normally, it becomes the
 * frame in forced-colours mode, where backgrounds are dropped.
 */
export const alertVariants = cva(
  "flex w-full items-start gap-3 rounded-xl border border-transparent px-4 py-3 text-left font-body-base text-sm",
  {
    variants: {
      tone: {
        neutral: "bg-surface-container-high text-on-surface",
        info: "bg-info-container text-on-info-container",
        success: "bg-success-container text-on-success-container",
        warning: "bg-warning-container text-on-warning-container",
        error: "bg-error-container text-on-error-container",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);
