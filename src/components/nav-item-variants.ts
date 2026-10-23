import { cva } from "class-variance-authority";

/**
 * NavItem style variants (cva). Formalizes the sidebar-row pattern: flat
 * rows on the row radius (`--ui-radius-row`), `level` picks top-level vs.
 * nested sizing, `active` carries the current-page state — a primary tint
 * with primary text, never a filled bar. Top-level rows are 38px: 14px text,
 * an 18px icon, 10px side inset.
 *
 * `collapsed` is the icon-only form a collapsed `SidePanel` puts its rows into. It hides
 * every **element** child that is not an `<svg>` and centers what is left, so
 * the row keeps its own height and inset (and therefore its hit target) at
 * the narrower column width. Two consequences worth knowing:
 *  - the rule is written as a child selector on the row itself, so it works
 *    identically when `asChild` renders a router `<a>` — the class lands on
 *    the `<a>`, and the `<a>`'s children are what gets hidden;
 *  - it cannot hide a bare **text node** (`<NavItem>Team</NavItem>`), because
 *    CSS has no selector for one. That is why `NavItem`'s `label` prop also
 *    sets `aria-label`: the accessible name is then guaranteed regardless, and
 *    the visual contract ("put the row's text in an element") is stated on the
 *    prop.
 */
export const navItemVariants = cva(
  "flex w-full items-center rounded-[var(--ui-radius-row)] transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface [&_svg]:shrink-0",
  {
    variants: {
      level: {
        top: "h-[38px] gap-2.5 px-2.5 font-body-base text-sm [&_svg]:size-[18px]",
        sub: "h-9 gap-2.5 px-2.5 font-body-base text-sm [&_svg]:size-4",
      },
      active: {
        true: "",
        false: "text-on-surface hover:bg-surface-container-low [&_svg]:text-on-surface-variant",
      },
      collapsed: {
        true: "justify-center [&>*:not(svg)]:hidden",
        false: "",
      },
    },
    compoundVariants: [
      {
        level: "top",
        active: true,
        className: "bg-primary/10 font-medium text-primary",
      },
      {
        level: "sub",
        active: true,
        className: "bg-primary/10 font-medium text-primary",
      },
    ],
    defaultVariants: {
      level: "top",
      active: false,
      collapsed: false,
    },
  },
);
