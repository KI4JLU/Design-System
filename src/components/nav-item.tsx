import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { navItemDescriptionVariants, navItemVariants } from "./nav-item-variants";
import { useSidebarCollapsed } from "./sidebar-context";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

/**
 * Sidebar/menu navigation row: icon + label (+ optional trailing element,
 * e.g. a chevron with `ml-auto`). `active` marks the current page and sets
 * `aria-current="page"`. Use `asChild` to render a router <Link>; without it
 * a <button> is rendered (pass type="button" in forms). Styling is complete —
 * consumers add no skin classes (className is for layout exceptions only).
 *
 * **Collapsing.** Inside a collapsed `SidePanel` (the rail) a row that was
 * given a `label` renders icon-only: the text is hidden, `aria-label` keeps the accessible
 * name, and a `Tooltip` gives sighted pointer/keyboard users the same text
 * back. Rows without a `label` are left exactly as they are — the row cannot
 * invent a name it was not told, and silently dropping a label would be the
 * a11y regression this prop exists to prevent.
 *
 * **Description.** `description` adds a smaller second line under the label
 * (export formats: "SRT" over "Untertitel mit Zeitstempeln"). It describes the
 * row (`aria-describedby`) rather than joining its name. The leading icon must
 * be the row's first child and an `<svg>` for the line to align under the
 * label. Collapsed, it is hidden with the rest of the text.
 *
 * **Disabled.** Pass `disabled` on a button row; on an `asChild` link pass
 * `aria-disabled="true"` and stop the navigation yourself (a link cannot be
 * disabled natively). Both get the disabled look.
 */
export interface NavItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    // `collapsed` is deliberately not a consumer prop: it comes from the
    // surrounding SidePanel, so one column cannot end up half collapsed.
    Omit<VariantProps<typeof navItemVariants>, "collapsed"> {
  asChild?: boolean;
  /**
   * The row's text, as a plain string — the accessible name and the tooltip
   * text while the surrounding `SidePanel` is collapsed. **Required for a row to
   * collapse**; without it the row keeps rendering its children at full width.
   *
   * Pass the same text you render as children, and render that text inside an
   * element (`<span>Team</span>`, not a bare `Team`): the collapsed form hides
   * element children, and CSS cannot hide a bare text node.
   */
  label?: string;
  /** A second, smaller line under the label. Exposed as the row's description, not its name. */
  description?: React.ReactNode;
}

const NavItem = React.forwardRef<HTMLButtonElement, NavItemProps>(
  (
    {
      className,
      level,
      active,
      label,
      description,
      asChild = false,
      children,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const sidebarCollapsed = useSidebarCollapsed();
    // A row only collapses if it was told its name. Both conditions, so a
    // `label` outside a sidebar changes nothing and a collapsed sidebar never
    // strips a row of the only text it has.
    const collapsed = sidebarCollapsed && label !== undefined;
    const Comp = asChild ? Slot : "button";
    const descriptionId = React.useId();
    const hasDescription = description !== undefined && description !== null && description !== false;
    // Collapsed, the line is hidden and the rail's Tooltip describes the row
    // (it sets aria-describedby itself, which this must not override).
    const describedBy =
      [hasDescription && !collapsed ? descriptionId : undefined, ariaDescribedBy]
        .filter(Boolean)
        .join(" ") || undefined;

    const descriptionLine = hasDescription ? (
      // aria-hidden: read once, as the description, instead of also being
      // concatenated into the row's name.
      <span
        id={descriptionId}
        aria-hidden="true"
        data-slot="nav-item-description"
        className={navItemDescriptionVariants({ level })}
      >
        {description}
      </span>
    ) : null;

    // With asChild the line goes inside the child element (Slottable), so it
    // lands in the <a>, next to the link's own icon and label.
    const content = asChild ? (
      hasDescription && React.isValidElement<{ children?: React.ReactNode }>(children) ? (
        React.cloneElement(children, undefined, children.props.children, descriptionLine)
      ) : (
        children
      )
    ) : (
      <>
        {children}
        {descriptionLine}
      </>
    );

    const row = (
      <Comp
        ref={ref}
        aria-current={active ? "page" : undefined}
        // Only while collapsed: expanded, the visible text is the name, and
        // an aria-label would silently override it (and could drift from it).
        aria-label={collapsed ? label : undefined}
        // Spread, not `aria-describedby={undefined}`: an explicit undefined
        // would override the one the collapsed rail's Tooltip slots in.
        {...(describedBy ? { "aria-describedby": describedBy } : {})}
        className={cn(
          navItemVariants({
            level,
            active,
            collapsed,
            withDescription: hasDescription && !collapsed,
            className,
          }),
        )}
        {...props}
      >
        {content}
      </Comp>
    );

    if (!collapsed) return row;

    // The tooltip only *describes* the row — the accessible name is already on
    // it via aria-label, which is the condition tooltip.tsx states for using
    // one at all. `side="right"` because the row sits against the left edge of
    // the viewport in a collapsed column.
    return (
      <Tooltip>
        <TooltipTrigger asChild>{row}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  },
);
NavItem.displayName = "NavItem";

export { NavItem };
