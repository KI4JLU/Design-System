import * as React from "react";
import { cn } from "../lib/utils";

export interface PanelSectionProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title: React.ReactNode;
  /** Right side of the title row: a counter, or an action button. */
  aside?: React.ReactNode;
  hint?: React.ReactNode;
  /** Take the remaining height (e.g. a growing editor). */
  grow?: boolean;
  titleId?: string;
}

/**
 * One titled block of a settings window: title row (+ `aside`), a muted hint,
 * then the content. Consecutive sections are divided by a rule, so a window
 * made of them reads as one form. Inside a `SettingsDialog`, the title stays
 * as the heading of whichever of its rows the dialog's search shows.
 */
const PanelSection = React.forwardRef<HTMLElement, PanelSectionProps>(
  ({ title, aside, hint, grow, titleId, className, children, ...props }, ref) => {
    const generated = React.useId();
    const id = titleId ?? generated;
    return (
      <section
        ref={ref}
        aria-labelledby={id}
        data-slot="panel-section"
        className={cn(
          "flex flex-col gap-2 [&+[data-slot=panel-section]]:border-t [&+[data-slot=panel-section]]:border-outline-variant [&+[data-slot=panel-section]]:pt-6",
          grow && "min-h-64 flex-1",
          className,
        )}
        {...props}
      >
        {/* `data-search-keep`: inside a SettingsDialog whose search shows some of this section's rows,
            the title stays as their heading (tokens.css). */}
        <div data-search-keep="" className="flex min-h-8 items-center justify-between gap-3">
          <h3 id={id} className="m-0 text-base font-semibold text-on-surface">{title}</h3>
          {aside && <div className="text-xs tabular-nums text-on-surface-variant">{aside}</div>}
        </div>
        {hint && <p className="m-0 text-sm text-on-surface-variant">{hint}</p>}
        {children}
      </section>
    );
  },
);
PanelSection.displayName = "PanelSection";

export { PanelSection };
