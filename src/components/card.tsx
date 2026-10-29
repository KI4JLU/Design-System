import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../lib/utils";

/**
 * Shared card surface. Replaces the repeated
 * `bg-surface-container-lowest border border-outline-variant rounded-xl` blocks.
 *
 * `interactive` — hover highlight for clickable cards in grids: the existing
 * border takes the primary color, so the card stays put (no translate) and
 * nothing around it shifts. Combine with a focusable child (link/button) for
 * keyboard users.
 * `accent` — left primary accent border (step/callout cards).
 * Both compose freely with each other and the sub-parts.
 *
 * `variant="discover"` — the catalog card of a topic or collection: a
 * `CardCover` band across the top (its colour is the caller's, e.g. a
 * gradient), then a `CardHeader` holding a `CardMeta` line, a larger
 * `CardTitle` and the `CardDescription`. The parts read the variant from the
 * card (`data-variant`), so a call site writes no sizes of its own.
 */
export type CardVariant = "default" | "discover";

export interface CardProps extends React.ComponentProps<"div"> {
  /** Hover highlight for clickable cards — recolors the border, no movement. */
  interactive?: boolean;
  /** Left primary accent border (steps, callouts). */
  accent?: boolean;
  /** `discover`: cover band + meta line + large title (catalog cards). */
  variant?: CardVariant;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, accent = false, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card"
      data-variant={variant}
      className={cn(
        "group/card rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface shadow-card",
        variant === "discover" && "flex flex-col overflow-hidden",
        interactive && "transition-colors hover:border-primary",
        accent && "border-l-4 border-l-primary",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

/**
 * The cover band of a `discover` card: decorative, full width, flush with the
 * card's top corners (the card clips it). Its colour comes from the caller —
 * `style={{ backgroundImage: … }}` or a `bg-*` class; without one it is a
 * neutral surface.
 */
const CardCover = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      data-slot="card-cover"
      className={cn("h-24 shrink-0 bg-surface-container-high bg-cover", className)}
      {...props}
    />
  ),
);
CardCover.displayName = "CardCover";

const CardHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-1.5 p-6",
        "group-data-[variant=discover]/card:flex-1 group-data-[variant=discover]/card:gap-3 group-data-[variant=discover]/card:px-7 group-data-[variant=discover]/card:pb-7 group-data-[variant=discover]/card:pt-5",
        className,
      )}
      {...props}
    />
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
        className={cn(
          "m-0 font-headline-md text-headline-md font-semibold text-on-surface",
          "group-data-[variant=discover]/card:text-display-lg group-data-[variant=discover]/card:leading-tight",
          className,
        )}
        {...props}
      />
    );
  },
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "text-sm text-on-surface-variant",
        "group-data-[variant=discover]/card:mt-1 group-data-[variant=discover]/card:text-body-base",
        className,
      )}
      {...props}
    />
  ),
);
CardDescription.displayName = "CardDescription";

/**
 * One line of facts above a `discover` card's title — a category pill, a
 * count, a date — wrapping when it does not fit. Separators are the caller's.
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

const CardContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardCover, CardHeader, CardMeta, CardTitle, CardDescription, CardContent, CardFooter };
