import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { colorSwatchVariants } from "./color-swatch-variants";

export interface ColorSwatchProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color">,
    VariantProps<typeof colorSwatchVariants> {
  /** Any CSS colour value — usually `categoryColor(key)` (`var(--color-category-N)`). */
  color: string;
  /**
   * Accessible name. Without it the dot is decorative (`aria-hidden`), because
   * the text beside it carries the meaning; with it the dot is `role="img"`.
   */
  label?: string;
}

/**
 * A round colour dot beside a name — a speaker legend, a category list. It
 * shows **data** colours: whatever a category or speaker was given, typically
 * from the category palette. Colour is never the only cue, so the dot is
 * decorative unless `label` names it.
 *
 * Not `AccentSwatch`: that one takes an `AccentColor` and shows the theme's
 * accent choices (`--accent-swatch-*`) in the appearance picker. Use
 * ColorSwatch for everything else that needs a coloured dot.
 */
const ColorSwatch = React.forwardRef<HTMLSpanElement, ColorSwatchProps>(
  ({ color, label, size, className, style, ...props }, ref) => (
    <span
      ref={ref}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      data-slot="color-swatch"
      className={cn(colorSwatchVariants({ size }), className)}
      style={{ backgroundColor: color, ...style }}
      {...props}
    />
  ),
);
ColorSwatch.displayName = "ColorSwatch";

export { ColorSwatch };
