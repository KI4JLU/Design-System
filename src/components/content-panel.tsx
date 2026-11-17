import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./button";

export interface ContentPanelProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title: React.ReactNode;
  /** Given, a close button sits in the header. */
  onClose?: () => void;
  closeLabel?: string;
  /** Pinned below the scrolling body (actions). */
  footer?: React.ReactNode;
  /** Id of the title, for `aria-labelledby`. Generated when omitted. */
  titleId?: string;
}

/**
 * A panel that takes a whole content area (an editor that replaces the view
 * it belongs to): header with title and close, a scrolling body capped at a
 * readable width, a pinned footer. Needs a flex-column parent with a height.
 */
const ContentPanel = React.forwardRef<HTMLElement, ContentPanelProps>(
  ({ title, onClose, closeLabel = "Schließen", footer, titleId, className, children, ...props }, ref) => {
    const generated = React.useId();
    const id = titleId ?? generated;
    const rail = "mx-auto flex w-full max-w-[880px] shrink-0 items-center gap-3 px-6 py-4";
    return (
      <section
        ref={ref}
        aria-labelledby={id}
        data-slot="content-panel"
        className={cn("flex min-h-0 flex-1 flex-col bg-surface", className)}
        {...props}
      >
        <header className={cn(rail, "justify-between")}>
          <h2 id={id} className="m-0 text-xl font-semibold text-on-surface">{title}</h2>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} aria-label={closeLabel} title={closeLabel}>
              <X aria-hidden="true" className="size-[18px]" />
            </Button>
          )}
        </header>
        <div className="mx-auto flex min-h-0 w-full max-w-[880px] flex-1 flex-col gap-6 overflow-y-auto px-6 pb-4">
          {children}
        </div>
        {footer && <footer className={cn(rail, "justify-between border-t border-outline-variant")}>{footer}</footer>}
      </section>
    );
  },
);
ContentPanel.displayName = "ContentPanel";

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
 * One titled block of a settings-style panel: title row (+ `aside`), a muted
 * hint, then the content. Consecutive sections are divided by a rule, so a
 * panel made of them reads as one form.
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

export { ContentPanel, PanelSection };
