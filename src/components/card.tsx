import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../lib/utils";
import { cardAccentStyle, cardSurfaceClassName } from "./card-variants";

/**
 * Shared card surface. Replaces the repeated
 * `bg-surface-container-lowest border border-outline-variant rounded-xl` blocks.
 *
 * `interactive` — hover highlight for clickable cards in grids: the existing
 * border takes the primary color, so the card stays put (no translate) and
 * nothing around it shifts. Combine with a focusable child (link/button) for
 * keyboard users.
 * `accent` — left accent border (step/callout cards, list rows): the
 * `accentColor`, primary without one.
 * `accentColor` — the card's own colour (a category's, a role's), any CSS
 * colour; the parts below draw with it. Unset, they stay neutral.
 * `tint` — the accent colour faded in from the left edge over the card's
 * surface (a list row's quiet colour cue). No tint without an `accentColor`.
 *
 * The hairline card (developer mockup „Hairline", 30.10.2026): a `CardBand`
 * on top — title and the card's own controls on a faint tint of the accent
 * colour — closed by a `CardHairline`, a 2px rule in the accent colour that
 * can carry one item (a category badge, an icon tile) centred on it; then
 * `CardContent` and a `CardFooter` pinned to the bottom. Without an
 * `accentColor` the band has no tint and the rule is the neutral outline
 * colour. The parts carry their own sizes, so a call site writes none.
 */
export interface CardProps extends React.ComponentProps<"div"> {
  /** Hover highlight for clickable cards — recolors the border, no movement. */
  interactive?: boolean;
  /** Left accent border (steps, callouts, list rows) in `accentColor`, else primary. */
  accent?: boolean;
  /** The card's colour (any CSS colour) for the band tint, the hairline and `accent`/`tint`. */
  accentColor?: string;
  /** The accent colour faded in from the left edge. Needs `accentColor`. */
  tint?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, accent = false, accentColor, tint = false, style, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card"
      style={cardAccentStyle(accentColor, style)}
      className={cn(
        cardSurfaceClassName,
        interactive && "transition-colors hover:border-primary",
        accent && "border-l-4 border-l-[var(--card-accent,var(--color-primary))]",
        // An unset --card-accent makes the whole gradient invalid: no tint.
        tint &&
          "bg-[linear-gradient(90deg,color-mix(in_oklab,var(--card-accent)_9%,var(--color-surface-container-lowest)),var(--color-surface-container-lowest)_45%)]",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

/**
 * The top of a hairline card: the title (`CardTitle`) and the card's own
 * controls (a favorite star, an `ActionMenu`) in one row, on a faint tint of
 * the card's accent colour that fades out to the right. Flush with the card's
 * top corners. A `CardTitle` in it takes the band's size (18px, two lines at
 * most) and the free width; the controls sit at the end.
 */
const CardBand = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-band"
      className={cn(
        "flex min-h-16 shrink-0 items-center gap-1 rounded-t-[inherit] px-5 py-3.5",
        // An unset --card-accent makes the whole gradient invalid: no tint.
        "bg-[linear-gradient(105deg,color-mix(in_oklab,var(--card-accent)_16%,transparent),transparent_70%)]",
        "*:data-[slot=card-title]:line-clamp-2 *:data-[slot=card-title]:min-w-0 *:data-[slot=card-title]:flex-1 *:data-[slot=card-title]:font-sans *:data-[slot=card-title]:text-lg *:data-[slot=card-title]:leading-snug",
        className,
      )}
      {...props}
    />
  ),
);
CardBand.displayName = "CardBand";

/**
 * The rule under a `CardBand`: 2px in the card's accent colour (without one
 * `cardNeutralAccent`, a quiet grey), full width. Its children — one item: a category badge, an
 * icon tile — sit centred on it at the content's left inset; give them an
 * opaque background so the rule does not run through them. The item's lower
 * half takes room in the flow, so the content below starts clear of it; an
 * empty rule keeps the room of a badge, so a grid of cards with and without
 * one lines up.
 */
const CardHairline = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-hairline"
      className={cn(
        // Room for a badge-sized item even without one, so the content of
        // cards with and without an item starts at the same height in a grid.
        "relative flex min-h-6.5 shrink-0 px-5 pb-1",
        "before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:-translate-y-1/2 before:bg-[var(--card-accent,color-mix(in_oklab,var(--color-outline)_35%,transparent))]",
        className,
      )}
      {...props}
    >
      {children != null && children !== false && (
        <div className="relative flex -translate-y-1/2 items-center gap-2">{children}</div>
      )}
    </div>
  ),
);
CardHairline.displayName = "CardHairline";

const CardHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

/**
 * A card title is **not** a page heading, which is why this renders a `div`
 * and keeps doing so by default: cards appear in grids, and a grid of `<h2>`s
 * that name nothing in the outline is worse than a grid of styled text (see
 * `docs/COMPONENT_GUIDELINES.md` → „Page headings: who owns them").
 *
 * `asChild` is the way out for the cases where the card genuinely *is* a
 * titled section of the page — the one in this library is `AuthLayout`, whose
 * card holds the whole page's title. It renders the single child element
 * instead of the `div` and hands it the type tokens, so the level is the call
 * site's choice and the look does not change.
 *
 * The `m-0` exists for exactly that path: as a `div` the element has no
 * user-agent margin, but as an `<h1>`–`<h6>` it does, and a consuming app that
 * reverts element margins in `@layer base` would otherwise push the title
 * apart from its description.
 *
 * In a `CardBand` the title takes the band's size (see there).
 */
export interface CardTitleProps extends React.ComponentProps<"div"> {
  /** Render the single child element instead of a `div` (e.g. an `<h1>`). */
  asChild?: boolean;
}

const CardTitle = React.forwardRef<HTMLDivElement, CardTitleProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        ref={ref}
        data-slot="card-title"
        className={cn("m-0 font-headline-md text-headline-md font-semibold text-on-surface", className)}
        {...props}
      />
    );
  },
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm text-on-surface-variant", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

/**
 * One line of facts — a count, a date, a category — wrapping when it does not
 * fit (e.g. a catalog card's footer). Separators are the caller's.
 */
const CardMeta = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-meta"
      className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-on-surface-variant", className)}
      {...props}
    />
  ),
);
CardMeta.displayName = "CardMeta";

/**
 * The card's body. In a hairline card (one with a `CardBand`) it takes the
 * band's side inset (20px) and grows, so the `CardFooter` sits at the bottom.
 */
const CardContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-content"
      className={cn(
        "p-6 pt-0",
        "group-has-[>[data-slot=card-band]]/card:flex-1 group-has-[>[data-slot=card-band]]/card:px-5 group-has-[>[data-slot=card-band]]/card:pb-4",
        className,
      )}
      {...props}
    />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-footer"
      className={cn(
        "flex items-center p-6 pt-0",
        "group-has-[>[data-slot=card-band]]/card:mt-auto group-has-[>[data-slot=card-band]]/card:gap-2 group-has-[>[data-slot=card-band]]/card:px-5 group-has-[>[data-slot=card-band]]/card:pb-4",
        className,
      )}
      {...props}
    />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardBand, CardHairline, CardHeader, CardMeta, CardTitle, CardDescription, CardContent, CardFooter };
