import { cva } from "class-variance-authority";

/**
 * Progress track (cva): the full-length groove the indicator fills. `size`
 * picks its height — `sm` (4px) for dense list rows, `default` (8px).
 * In forced-colours mode backgrounds are dropped, so the track draws an
 * outline there instead.
 */
export const progressTrackVariants = cva(
  "relative min-w-0 flex-1 overflow-hidden rounded-full bg-surface-container-high forced-colors:outline forced-colors:outline-1",
  {
    variants: {
      size: {
        sm: "h-1",
        default: "h-2",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

/**
 * Progress indicator (cva): the filled part. `tone` follows the state of the
 * work — `primary` while it runs, `success` when done, `error` when it failed.
 * Every tone has at least 3:1 against the track (WCAG 1.4.11).
 *
 * `indeterminate` is a 2/5-wide segment that slides through the track
 * (`animate-progress-indeterminate`); under `prefers-reduced-motion` it stands
 * still in the middle, which no determinate bar does (they start at the left
 * edge). Opacity stays at 100%, so the 3:1 contrast holds.
 */
export const progressIndicatorVariants = cva(
  "h-full rounded-full forced-colors:bg-[Highlight]",
  {
    variants: {
      tone: {
        primary: "bg-primary",
        success: "bg-success",
        error: "bg-error",
      },
      indeterminate: {
        true: "w-2/5 animate-progress-indeterminate motion-reduce:animate-none motion-reduce:translate-x-3/4",
        false: "transition-[width] duration-300 ease-out motion-reduce:transition-none",
      },
    },
    defaultVariants: {
      tone: "primary",
      indeterminate: false,
    },
  },
);

/** The visible percentage beside the bar (`showValue`). */
export const progressValueVariants = cva(
  "min-w-[5ch] shrink-0 text-right text-on-surface-variant tabular-nums",
  {
    variants: {
      size: {
        sm: "text-xs",
        default: "text-sm",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);
