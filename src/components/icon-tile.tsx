import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../lib/utils";
import { iconTileVariants } from "./icon-tile-variants";

/**
 * A square field around one icon, tinted in a tone: a role's icon, the media
 * of an `Item` (`<ItemMedia><IconTile tone="warning"><Star /></IconTile></ItemMedia>`),
 * a card's emblem on its hairline.
 *
 * Hand-built on the registry contract (docs/COMPONENT_GUIDELINES.md). Its
 * relatives are shadcn/ui's `ItemMedia variant="icon"` and `Avatar`:
 * ItemMedia's icon field has one neutral look, no tones and no sizes, and
 * exists only inside an Item; Avatar is round and for people. Neither can be
 * imported for a toned icon field, so this follows their shape — one element,
 * `data-slot`, `asChild`, variants in `icon-tile-variants.ts`, state as data
 * attributes (`data-tone`, `data-size`).
 *
 * Decorative by default (`aria-hidden`): the text next to it names what the
 * icon shows. A tile that stands alone gets `aria-hidden={false}` and an
 * `aria-label`; it then renders as `role="img"`, so the label is its name.
 */
export interface IconTileProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof iconTileVariants> {
  asChild?: boolean;
}

const IconTile = React.forwardRef<HTMLSpanElement, IconTileProps>(
  ({ className, tone = "primary", size = "md", asChild = false, "aria-hidden": ariaHidden, ...props }, ref) => {
    const Comp = asChild ? Slot : "span";
    const standalone = ariaHidden === false || ariaHidden === "false";
    return (
      <Comp
        ref={ref}
        aria-hidden={standalone ? undefined : "true"}
        role={standalone ? "img" : undefined}
        data-slot="icon-tile"
        data-tone={tone}
        data-size={size}
        className={cn(iconTileVariants({ tone, size }), className)}
        {...props}
      />
    );
  },
);
IconTile.displayName = "IconTile";

export { IconTile };
