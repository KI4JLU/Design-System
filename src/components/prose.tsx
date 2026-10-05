import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { proseVariants } from "./prose-variants";

/**
 * Wrapper for rendered rich text — Markdown output, a read-only Tiptap
 * document, CMS HTML — whose elements the consumer cannot class one by one.
 * It styles the descendants with tokens and the DS type scale; see
 * `proseVariants` for the element list.
 *
 * `size`: `default` for reading (documents, summaries), `compact` for dense
 * places (side panels, tiles). `asChild` puts the classes on the single child
 * instead of a `div` (e.g. an `<article>`). An editor that owns its root
 * (Tiptap) uses `proseVariants()` directly.
 *
 * Content only: the wrapper sets no width. Put it in a `Container
 * size="reading"` or a card for a readable measure.
 */
export interface ProseProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof proseVariants> {
  /** Render the single child element with the prose classes instead of a `div`. */
  asChild?: boolean;
}

const Prose = React.forwardRef<HTMLDivElement, ProseProps>(
  ({ className, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return <Comp ref={ref} className={cn(proseVariants({ size }), className)} {...props} />;
  },
);
Prose.displayName = "Prose";

export { Prose };
