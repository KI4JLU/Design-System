import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { badgeVariants } from "./badge-variants";

/**
 * Status badge/chip. `tone` speaks the semantic status vocabulary
 * (success/warning/error/info/…), `appearance` picks the shape:
 * `filled` pill (status labels, KPI deltas) or `text` inline icon+text
 * (health checks). Icons are passed as children (lucide, width/height 1em);
 * add `animate-spin` on a loader icon at the call site.
 * `dot` renders a leading status dot in the tone's text color (the
 * "online"/live-status pill pattern) — decorative, the text carries the
 * meaning.
 */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Leading status dot in the tone color (e.g. live/online pills). */
  dot?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, appearance, tone, dot = false, children, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="badge"
      className={cn(badgeVariants({ appearance, tone, className }))}
      {...props}
    >
      {dot && (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-current"
        />
      )}
      {children}
    </span>
  ),
);
Badge.displayName = "Badge";

export { Badge };
