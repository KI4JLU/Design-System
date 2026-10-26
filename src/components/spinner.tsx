import * as React from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "../lib/utils";

/**
 * Loading spinner. Replaces the ad-hoc `LoaderCircle` + `animate-spin`
 * copies. Announces itself to screen readers via role="status" and a
 * visually hidden label (override with `label` when "Wird geladen …"
 * doesn't fit the context). Inherits its color from the surrounding text
 * (currentColor), so it works inside buttons and tinted surfaces alike.
 *
 * `variant="dots"`: three dots pulsing in turn — a reply being prepared in a
 * chat (the "typing" cue), where a spinning ring reads as a stuck control.
 * Without motion (prefers-reduced-motion) the dots stay still and dimmed.
 */
const spinnerSizes = {
  sm: "h-4 w-4",
  default: "h-5 w-5",
  lg: "h-8 w-8",
} as const;

const dotSizes = {
  sm: "size-1.5 gap-1",
  default: "size-2 gap-1.5",
  lg: "size-2.5 gap-2",
} as const;

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: keyof typeof spinnerSizes;
  /** `circle` (default): a spinning ring. `dots`: three pulsing dots. */
  variant?: "circle" | "dots";
  /** Screen-reader label. Default: "Wird geladen …" */
  label?: string;
}

const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ className, size = "default", variant = "circle", label = "Wird geladen …", ...props }, ref) => {
    const [dot, gap] = dotSizes[size].split(" ");
    return (
      <span
        ref={ref}
        role="status"
        data-variant={variant}
        className={cn("inline-flex items-center justify-center", className)}
        {...props}
      >
        {variant === "dots" ? (
          <span aria-hidden="true" className={cn("inline-flex items-center", gap)}>
            {[0, 160, 320].map((delay) => (
              <span
                key={delay}
                data-slot="spinner-dot"
                className={cn("rounded-full bg-current opacity-40 motion-safe:animate-spinner-dot", dot)}
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </span>
        ) : (
          <LoaderCircle aria-hidden="true" className={cn("animate-spin", spinnerSizes[size])} />
        )}
        <span className="sr-only">{label}</span>
      </span>
    );
  },
);
Spinner.displayName = "Spinner";

export { Spinner };
