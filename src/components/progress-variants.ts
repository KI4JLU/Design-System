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
 * `indeterminate` fills the whole track and pulses; under
 * `prefers-reduced-motion` it stands still at half strength, which keeps it
 * apart from a full, finished bar.
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
        true: "w-full animate-pulse motion-reduce:animate-none motion-reduce:opacity-50",
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
