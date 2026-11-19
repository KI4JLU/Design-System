import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../lib/utils";
import { measureScrollingText, scrollingTextAttribute, scrollingTextClassName } from "../lib/scrolling-text";

export interface ScrollingTextProps extends React.ComponentProps<"span"> {
  /** Render the single child element instead of a `span` (a button, a link). */
  asChild?: boolean;
}

/**
 * One line of text that never wraps: cut with an ellipsis at rest, and shown
 * in full by scrolling to its end while the pointer rests on it — or anywhere
 * on the `Card` it is in — or while it holds the keyboard focus. It starts
 * after a short pause (`--scrolling-text-delay`, 600ms), moves at a steady
 * pace, stops at the end and is back at once when the pointer leaves. A text
 * that fits does nothing. With reduced motion it jumps to its end instead.
 *
 * For a name of any length in a place that is one line high: a card's title, a
 * row, a tab. A `CardTitle` in a `CardBand` already is one; use this for an
 * element inside the title (`<ScrollingText asChild><button>…</button></ScrollingText>`).
 * The text is the element's own content — no nested boxes.
 */
const ScrollingText = React.forwardRef<HTMLSpanElement, ScrollingTextProps>(
  ({ className, asChild = false, onPointerEnter, onFocus, ...props }, ref) => {
    const Comp = asChild ? Slot : "span";
    return (
      <Comp
        ref={ref}
        data-slot="scrolling-text"
        {...{ [scrollingTextAttribute]: "" }}
        className={cn(scrollingTextClassName, className)}
        onPointerEnter={(e) => {
          measureScrollingText(e.currentTarget);
          onPointerEnter?.(e);
        }}
        onFocus={(e) => {
          measureScrollingText(e.currentTarget);
          onFocus?.(e);
        }}
        {...props}
      />
    );
  },
);
ScrollingText.displayName = "ScrollingText";

export { ScrollingText };
