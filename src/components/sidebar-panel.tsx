import * as React from "react";
import { cn } from "../lib/utils";
import { SidebarScrollArea } from "./sidebar-scroll-area";

export interface SidebarPanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** The list's label ("Verlauf"): small and grey, directly above the list. */
  title?: React.ReactNode;
  /** Beside the heading, right-aligned (a small control, a count). */
  titleAside?: React.ReactNode;
  /** Fixed content under the heading: the primary action, a search, a selection bar. */
  head?: React.ReactNode;
  /**
   * Navigation rows (`NavItem`s) that stay put between the head and the
   * scrolling list — so one column can carry page navigation AND a content
   * list (`SidebarCard`s). Omit for a list-only or a nav-only column (a
   * nav-only column passes its rows as `children` and lets them scroll).
   */
  nav?: React.ReactNode;
  /** Fade at scrollable edges in px (0 = hard crop). Default 24. */
  fade?: number;
}

/** A node React renders as nothing — `head`'s notion of "not passed". */
function rendersNothing(node: React.ReactNode) {
  return node == null || typeof node === "boolean" || node === "";
}

/**
 * The body of a side column — the SAME frame on the left and the right, so a
 * change to one is a change to both: a fixed head (`head`, then optional `nav`
 * rows, then the list's `title`) and, below it, the column's list, which alone
 * scrolls (`SidebarScrollArea`: scrollbar kept in the right gutter, content
 * fading at scrollable edges).
 *
 * The one look: an 8px column inset, rows that bring their own 10px inset,
 * and `title` as a small grey label over the list ("Verlauf") — it labels the
 * list, so it sits directly above it, under the primary action. A column's
 * page title belongs in the `SidePanel` header row instead.
 *
 * Fills its column (`h-full`). `AppShellLayout` drops its nav padding around
 * a SidebarPanel, so the left and the right column start from the same box.
 *
 * Without `title`, `head` and `nav` there is no head: the list carries the
 * 8px top inset itself — the same inset `AppShellLayout`'s `p-2` nav wrapper
 * and a head give — so a nav-only column's first row sits on the same line
 * expanded and in the rail.
 *
 * `head` counts as passed unless React renders it as nothing (`null`,
 * `undefined`, a boolean, `""`). A component that returns `null` is still a
 * passed node — the panel cannot see inside it.
 */
const SidebarPanel = React.forwardRef<HTMLDivElement, SidebarPanelProps>(
  ({ title, titleAside, head, nav, fade = 24, className, children, ...props }, ref) => {
    const hasHead = Boolean(title) || !rendersNothing(head) || Boolean(nav);
    return (
      <div
        ref={ref}
        data-slot="sidebar-panel"
        className={cn("flex h-full min-h-0 flex-col", className)}
        {...props}
      >
        {hasHead && (
          <div
            data-slot="sidebar-panel-head"
            className="flex flex-none flex-col gap-2 px-2 pt-2 pb-1"
          >
            {head}
            {nav && (
              <div data-slot="sidebar-panel-nav" className="flex flex-col gap-0.5">
                {nav}
              </div>
            )}
            {title && (
              <div className="mt-2.5 flex min-h-6 items-center justify-between gap-2 px-2.5">
                <h2 className="m-0 text-[13px] font-medium text-outline">{title}</h2>
                {titleAside}
              </div>
            )}
          </div>
        )}
        {/* The inset on the scroller, not on the panel: the list scrolls under
            it and fades there, exactly as the rail's box does. */}
        <SidebarScrollArea
          gutter={8}
          fade={fade}
          className={cn("pb-4 pl-2", !hasHead && "pt-2")}
        >
          {children}
        </SidebarScrollArea>
      </div>
    );
  },
);
SidebarPanel.displayName = "SidebarPanel";

export { SidebarPanel };
