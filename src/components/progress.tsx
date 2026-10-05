import * as React from "react";
import { cn } from "../lib/utils";
import {
  progressIndicatorVariants,
  progressTrackVariants,
  progressValueVariants,
} from "./progress-variants";

const percentFormat = new Intl.NumberFormat("de-DE", {
  style: "percent",
  maximumFractionDigits: 0,
});

/** German percentage, e.g. „42 %" (with a no-break space). */
const formatPercentDe = (percent: number) => percentFormat.format(percent / 100);

/** A progress bar needs a name: `label`, or `aria-labelledby` pointing at visible text. */
type ProgressName =
  | { label: string; "aria-labelledby"?: string }
  | { label?: string; "aria-labelledby": string };

export type ProgressProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  // Owned by the component, so a spread cannot contradict `value` / `label`.
  | "role"
  | "children"
  | "aria-label"
  | "aria-labelledby"
  | "aria-valuemin"
  | "aria-valuemax"
  | "aria-valuenow"
> &
  ProgressName & {
    /** Current value, `0`–`max`; clamped. Omit (or `null`) for indeterminate. */
    value?: number | null;
    /** Value that means „done". Default: 100 */
    max?: number;
    /** State of the work: running (`primary`), done (`success`), failed (`error`). */
    tone?: "primary" | "success" | "error";
    /** Bar height: `sm` (4px) for dense rows, `default` (8px). */
    size?: "sm" | "default";
    /** Show the percentage beside the bar (its slot stays empty while indeterminate). */
    showValue?: boolean;
    /** Formats the visible percentage (0–100). Default: German, „42 %". */
    formatValue?: (percent: number) => string;
  };

/**
 * Progress bar for work that takes a while — an upload, a document being
 * translated. Native, no Radix: one element with `role="progressbar"`,
 * `aria-valuemin`/`-max`/`-now` and the accessible name from `label` (or
 * `aria-labelledby`). Pass `aria-valuetext` when the number alone says too
 * little („Seite 3 von 12").
 *
 * **Indeterminate.** Omit `value` while the amount is unknown (queued,
 * waiting for the server): `aria-valuenow` is left out, which is how assistive
 * technology recognises an indeterminate bar, and the bar pulses — standing
 * still under `prefers-reduced-motion`.
 *
 * **Not a live region.** A screen reader reads the value when it reaches the
 * bar; it does not announce every step. Announce the milestones (started,
 * done, failed) in a status text next to it instead.
 *
 * `className` is for layout (a width such as `w-24`); the track fills the
 * element, beside the optional `showValue` percentage.
 */
const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value,
      max = 100,
      tone = "primary",
      size = "default",
      label,
      showValue = false,
      formatValue = formatPercentDe,
      ...props
    },
    ref,
  ) => {
    const safeMax = max > 0 ? max : 100;
    const indeterminate = typeof value !== "number" || !Number.isFinite(value);
    const current = indeterminate ? undefined : Math.min(Math.max(value, 0), safeMax);
    const percent = current === undefined ? 0 : (current / safeMax) * 100;

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={current}
        className={cn("flex items-center gap-2", className)}
        {...props}
      >
        <div className={progressTrackVariants({ size })}>
          <div
            className={progressIndicatorVariants({ tone, indeterminate })}
            style={indeterminate ? undefined : { width: `${percent}%` }}
          />
        </div>
        {showValue ? (
          // aria-valuenow already carries the number; reading it twice helps no one.
          // Kept (empty) while indeterminate, so bars in a list stay aligned.
          <span aria-hidden="true" className={progressValueVariants({ size })}>
            {indeterminate ? null : formatValue(percent)}
          </span>
        ) : null}
      </div>
    );
  },
);
Progress.displayName = "Progress";

export { Progress };
