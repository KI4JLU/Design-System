import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { headingTag, type HeadingLevel } from "../lib/heading-level";
import {
  emptyStateDescriptionVariants,
  emptyStateIconVariants,
  emptyStateTitleVariants,
  emptyStateVariants,
} from "./empty-state-variants";

/**
 * The block that stands in for content that is not there: an empty list, a
 * search without hits, a page that was not found. Centered icon tile, title,
 * muted description and optional actions (DS `Button`s).
 *
 * `size="compact"` fits a table's empty row (one `TableCell` with `colSpan`
 * across all columns), a popover or a dashboard tile; `default` is the
 * page-level block, usually inside a `Card`.
 *
 * The title is a `<p>` unless `headingLevel` is given — an empty table row or
 * a tile names nothing in the outline. A whole-page state (not found, empty
 * dashboard) passes the level its place in the page needs, as with
 * `PageHeader` (`docs/COMPONENT_GUIDELINES.md` → „Page headings: who owns
 * them").
 *
 * No live region: the block is content, not a status message. A search that
 * empties its list as the user types announces the count in its own
 * `role="status"` element at the call site.
 */
export interface EmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof emptyStateVariants> {
  /** A lucide icon element; shown in a muted round tile, hidden from screen readers. */
  icon?: React.ReactNode;
  /** What is (not) here, e.g. „Noch keine Widgets". */
  title: React.ReactNode;
  /** One or two sentences on why, or what to do next. */
  description?: React.ReactNode;
  /** One or two `Button`s: add the first item, clear the search, go back. */
  actions?: React.ReactNode;
  /**
   * Render the title as a heading of this level (`1`–`6`). Omitted, the title
   * is a `<p>`: right for table rows, popovers and tiles.
   */
  headingLevel?: HeadingLevel;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    { className, size, icon, title, description, actions, headingLevel, ...props },
    ref,
  ) => {
    const Title = headingLevel ? headingTag(headingLevel) : "p";
    return (
      <div ref={ref} className={cn(emptyStateVariants({ size }), className)} {...props}>
        {icon ? (
          <span aria-hidden="true" className={emptyStateIconVariants({ size })}>
            {icon}
          </span>
        ) : null}
        <div className="flex flex-col items-center gap-1">
          <Title className={emptyStateTitleVariants({ size })}>{title}</Title>
          {description ? (
            <p className={emptyStateDescriptionVariants({ size })}>{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center justify-center gap-stack-sm">
            {actions}
          </div>
        ) : null}
      </div>
    );
  },
);
EmptyState.displayName = "EmptyState";

export { EmptyState };
