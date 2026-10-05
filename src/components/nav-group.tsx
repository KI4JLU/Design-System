import * as React from "react";
import { cn } from "../lib/utils";
import { headingTag, type HeadingLevel } from "../lib/heading-level";
import { useSidebarCollapsed } from "./sidebar-context";

/**
 * A titled group of sidebar `NavItem`s ("Verwaltung", "Module"): a
 * `role="group"` whose accessible name is its heading (`aria-labelledby`), so
 * a screen reader announces "Verwaltung, Gruppe" when entering the rows.
 *
 * **Heading.** Label typography, muted, inset `px-4` — the same inset as a
 * top-level `NavItem`'s padding, so the heading starts on the axis where the
 * rows' icons start. Built for `level="top"` rows.
 *
 * **Collapsed rail.** Inside a collapsed `SidePanel` there is no room for the
 * heading: it turns `sr-only` (still the group's name) and a short rule marks
 * the group boundary instead. A group that is the first child of its parent
 * draws no rule — there is no boundary above it.
 *
 * Rows are spaced `gap-2`, like `AppShellLayout`'s nav column.
 */
export interface NavGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** The group's heading; also its accessible name. */
  title: React.ReactNode;
  /**
   * Level of the heading in the document outline. Default `2`: a nav column
   * sits beside the page content, not inside its `<h1>` section. Pass `3`
   * inside a `SidebarPanel` whose own `title` is already an `<h2>`.
   */
  headingLevel?: HeadingLevel;
}

const NavGroup = React.forwardRef<HTMLDivElement, NavGroupProps>(
  ({ title, headingLevel = 2, className, children, ...props }, ref) => {
    const headingId = React.useId();
    const collapsed = useSidebarCollapsed();
    const Heading = headingTag(headingLevel);
    return (
      <div
        ref={ref}
        role="group"
        aria-labelledby={headingId}
        data-slot="nav-group"
        className={cn(
          "flex w-full flex-col gap-2 [&:first-child>[data-slot=nav-group-separator]]:hidden",
          className,
        )}
        {...props}
      >
        {collapsed && (
          <span
            aria-hidden="true"
            data-slot="nav-group-separator"
            className="mx-auto my-1 block h-px w-6 bg-outline-variant"
          />
        )}
        <Heading
          id={headingId}
          className={
            collapsed
              ? "sr-only"
              : "m-0 px-4 pt-2 font-label-sm text-label-sm text-on-surface-variant"
          }
        >
          {title}
        </Heading>
        {children}
      </div>
    );
  },
);
NavGroup.displayName = "NavGroup";

export { NavGroup };
