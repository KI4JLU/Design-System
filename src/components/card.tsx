import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { measureScrollingText, measureScrollingTextIn, scrollingTextAttribute, scrollingTextClassName } from "../lib/scrolling-text";
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
 * The hairline card (developer mockup „Hairline", 30.10.2026; glow
 * 05.11.2026): a `CardBand` on top — title and the card's own controls on the
 * card's own surface, lit by a soft glow of the accent colour rising from the
 * rule — closed by a `CardHairline`, a 2px rule in the accent colour that
 * can carry one item (a category badge, an icon tile) centred on it; then
 * `CardContent` and a `CardFooter` pinned to the bottom. Without an
 * `accentColor` the band takes a fainter glow in the primary colour and the
 * rule is a 1px line in the card's border colour. Never a grey band. The
 * parts carry their own sizes, so a call site writes none.
 */
export interface CardProps extends React.ComponentProps<"div"> {
  /** Hover highlight for clickable cards — recolors the border, no movement. */
  interactive?: boolean;
  /** Left accent border (steps, callouts, list rows) in `accentColor`, else primary. */
  accent?: boolean;
  /** The card's colour (any CSS colour) for the band glow, the hairline and `accent`/`tint`. */
  accentColor?: string;
  /** The accent colour faded in from the left edge. Needs `accentColor`. */
  tint?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, accent = false, accentColor, tint = false, style, onPointerEnter, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card"
      // A scrolling line in the card (a band's title) moves while the pointer
      // is anywhere on the card, so the card measures it on the way in.
      onPointerEnter={(e) => {
        measureScrollingTextIn(e.currentTarget);
        onPointerEnter?.(e);
      }}
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
 * controls (a favorite star, an `ActionMenu`) in one row. The band is the
 * card's own surface, never a grey bar; the colour comes as light from the
 * rule below — a radial glow from the lower left that fades into transparency,
 * over a faint wash from the left edge — in `--card-glow` (the accent colour
 * lifted, `cardGlowColor`), at `--card-glow-strength` (tokens.css, stronger in
 * dark mode). Without an accent colour: the primary colour at 44 % of that, no
 * wash. A solid tint at raised contrast (`data-contrast` `medium` or `more`),
 * none with reduced colours (`data-colors="reduced"`). Flush with the card's
 * top corners. A `CardTitle` in it takes the band's size (18px) and the free
 * width and stays on one line, cut with an ellipsis — so every band in a grid
 * is as high as the next — and scrolls to its end while the pointer rests on
 * the card (`ScrollingText`). An element in the title (a button, a link) is
 * that line itself: `<ScrollingText asChild>`. The controls sit at the end.
 */
const CardBandContext = React.createContext(false);

const CardBand = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <CardBandContext.Provider value>
    <div
      ref={ref}
      data-slot="card-band"
      className={cn(
        "flex min-h-16 shrink-0 items-center gap-1 rounded-t-[inherit] px-5 py-3.5",
        // The glow colour: the card's, or the primary colour, fainter. Mixed
        // in OKLCH into transparency, so it never turns grey on the way out.
        "[--band-glow:var(--card-glow,color-mix(in_oklch,var(--color-primary)_44%,transparent))]",
        "bg-[radial-gradient(75%_110%_at_18%_100%,color-mix(in_oklch,var(--band-glow)_var(--card-glow-strength),transparent),transparent_72%),linear-gradient(90deg,color-mix(in_oklch,var(--card-glow,transparent)_var(--card-glow-wash),transparent),transparent_80%)]",
        // Raised contrast (`medium`, and `more`, which includes it): the same
        // tint, solid instead of fading out.
        "in-data-[contrast=medium]:bg-none in-data-[contrast=more]:bg-none",
        "in-data-[contrast=medium]:bg-[color:color-mix(in_oklab,var(--card-accent,var(--color-outline))_16%,transparent)] in-data-[contrast=more]:bg-[color:color-mix(in_oklab,var(--card-accent,var(--color-outline))_16%,transparent)]",
        // Reduced colours (`data-colors`): no tint at all, at any contrast.
        "in-data-[colors=reduced]:bg-none! in-data-[colors=reduced]:bg-transparent!",
        "*:data-[slot=card-title]:min-w-0 *:data-[slot=card-title]:flex-1 *:data-[slot=card-title]:font-sans *:data-[slot=card-title]:text-lg *:data-[slot=card-title]:leading-snug",
        className,
      )}
      {...props}
    />
    </CardBandContext.Provider>
  ),
);
CardBand.displayName = "CardBand";

/**
 * The rule under a `CardBand`: 2px, solid, in the card's accent colour, with a
 * soft halo of its glow rising into the band (none with reduced colours);
 * without an accent colour a 1px line in the card's border colour, no halo.
 * Full width. Its children — one item: a category badge, an
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
        // A 2px box across the top edge (offset, not translated, so it stays
        // on whole pixels): its top border and its fill in the accent colour,
        // or only the border — 1px — in the card's border colour without one.
        "before:absolute before:inset-x-0 before:-top-px before:h-0.5 before:border-t before:border-solid",
        "before:border-t-[color:var(--card-accent,var(--color-outline-variant))] before:bg-[var(--card-accent,transparent)]",
        // The halo, clipped to the rule's width and to above it: light rising
        // into the band, not spilling past the card's edges or into the content.
        "before:[box-shadow:0_0_var(--card-rule-glow-blur)_0_color-mix(in_oklch,var(--card-glow,transparent)_var(--card-rule-glow-strength),transparent)] before:[clip-path:inset(-16px_0_0_0)]",
        "in-data-[colors=reduced]:before:[box-shadow:none]",
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
 * In a `CardBand` the title takes the band's size and is one scrolling line (see there).
 */
export interface CardTitleProps extends React.ComponentProps<"div"> {
  /** Render the single child element instead of a `div` (e.g. an `<h1>`). */
  asChild?: boolean;
}

const CardTitle = React.forwardRef<HTMLDivElement, CardTitleProps>(
  ({ className, asChild = false, onFocus, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    // In a band the title is one line that scrolls to its end under the
    // pointer; the card measures it, the title itself only for the focus.
    const inBand = React.useContext(CardBandContext);
    return (
      <Comp
        ref={ref}
        data-slot="card-title"
        {...(inBand ? { [scrollingTextAttribute]: "" } : null)}
        onFocus={(e) => {
          if (inBand) measureScrollingText(e.currentTarget);
          onFocus?.(e);
        }}
        className={cn("m-0 font-headline-md text-headline-md font-semibold text-on-surface", inBand && scrollingTextClassName, className)}
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
 * The card's facts stacked one per line — „Genutzt vor 2 Stunden", „von Test
 * User" — each a `CardMetaItem`. A `CardMeta` holds the same items side by
 * side instead.
 */
const CardMetaList = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} data-slot="card-meta-list" className={cn("flex min-w-0 flex-col gap-1", className)} {...props} />
  ),
);
CardMetaList.displayName = "CardMetaList";

/**
 * One fact: an icon, a muted label and the value in the text colour —
 * `<CardMetaItem><Clock aria-hidden="true" /><CardMetaLabel>Genutzt</CardMetaLabel>
 * <CardMetaValue>vor 2 Stunden</CardMetaValue></CardMetaItem>`. The icon (a
 * direct `svg` child) takes 16px; the value is one line and ends in an
 * ellipsis when the card is too narrow, the label keeps its width. Composed
 * like shadcn's `Item` (media, title, description as parts), sized for a
 * card's meta block.
 *
 * `tone="primary"` sets the fact apart — icon and value in the primary
 * colour, the label stays muted (the caller's role on a topic card).
 */
export interface CardMetaItemProps extends React.ComponentProps<"div"> {
  /** `primary`: icon and value in the primary colour. Default `neutral`. */
  tone?: "neutral" | "primary";
}

const CardMetaItem = React.forwardRef<HTMLDivElement, CardMetaItemProps>(
  ({ className, tone = "neutral", ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-meta-item"
      data-tone={tone}
      className={cn(
        "group/card-meta-item flex min-w-0 items-center gap-1 font-label-sm text-label-sm text-on-surface-variant",
        "[&>svg]:mr-1 [&>svg]:size-4 [&>svg]:shrink-0",
        "data-[tone=primary]:[&>svg]:text-primary",
        className,
      )}
      {...props}
    />
  ),
);
CardMetaItem.displayName = "CardMetaItem";

/** The fact's name, muted: „Genutzt", „von". */
const CardMetaLabel = React.forwardRef<HTMLSpanElement, React.ComponentProps<"span">>(
  ({ className, ...props }, ref) => (
    <span ref={ref} data-slot="card-meta-label" className={cn("shrink-0", className)} {...props} />
  ),
);
CardMetaLabel.displayName = "CardMetaLabel";

/**
 * The fact itself, in the text colour and semibold — the primary colour in a
 * `tone="primary"` item; one line, cut with an ellipsis.
 */
const CardMetaValue = React.forwardRef<HTMLSpanElement, React.ComponentProps<"span">>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="card-meta-value"
      className={cn(
        "min-w-0 truncate font-semibold text-on-surface group-data-[tone=primary]/card-meta-item:text-primary",
        className,
      )}
      {...props}
    />
  ),
);
CardMetaValue.displayName = "CardMetaValue";

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

export {
  Card,
  CardBand,
  CardHairline,
  CardHeader,
  CardMeta,
  CardMetaList,
  CardMetaItem,
  CardMetaLabel,
  CardMetaValue,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
