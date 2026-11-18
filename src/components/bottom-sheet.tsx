import * as React from "react";
import { cn } from "../lib/utils";
import { Drawer, DrawerBody, DrawerContent, DrawerTitle } from "./drawer";

/** The sheet's grip above its first row, in px (`mt-4` + `h-2` of `DrawerContent`). */
const GRIP_HEIGHT = 24;
/** The stops of a sheet whose content is longer than the first: half the screen, then all of it. */
const SNAP_POINTS = [0.5, 1];

export interface BottomSheetProps extends Omit<React.ComponentProps<typeof DrawerContent>, "title"> {
  /** Shown (`true`) or not. Consumer state. */
  open: boolean;
  /** The sheet was swiped away, or closed by the scrim or Esc; carries the REQUESTED state. */
  onOpenChange: (open: boolean) => void;
  /** Accessible name of the sheet's dialog. Not shown: `header` carries the visible title. */
  label: string;
  /** A fixed row above the scrolling content: title, a close button. It drags the sheet. */
  header?: React.ReactNode;
  /** A fixed row below the scrolling content. */
  footer?: React.ReactNode;
  /** The scrolling content. */
  children?: React.ReactNode;
}

/**
 * A sheet from the bottom edge that is **as tall as its content, and no
 * taller than half the screen** — the height a phone's own half-height
 * sheets have. Where the content is longer than that, the sheet gets two
 * stops and drags up to the whole screen and back; the content scrolls
 * inside whichever part is on screen.
 *
 * A `Drawer` with that one rule built in. Use `Drawer` directly for a sheet
 * with its own stops or from another edge.
 */
function BottomSheet({ open, onOpenChange, label, header, footer, className, children, ...props }: BottomSheetProps) {
  // Whether the sheet, unconstrained, would be taller than half the screen:
  // its fixed rows plus the content's own height, re-read when either or
  // the window changes.
  const [body, setBody] = React.useState<HTMLDivElement | null>(null);
  const [content, setContent] = React.useState<HTMLDivElement | null>(null);
  const [long, setLong] = React.useState(false);
  React.useLayoutEffect(() => {
    if (!body || !content) return;
    const scroller = content.parentElement!;
    const measure = () => {
      // Unlaid-out (no layout engine, a hidden tree): not a measurement.
      if (content.offsetHeight === 0) return;
      const natural = GRIP_HEIGHT + (body.offsetHeight - scroller.clientHeight) + content.offsetHeight;
      setLong(natural > window.innerHeight / 2);
    };
    measure();
    window.addEventListener("resize", measure);
    if (typeof ResizeObserver === "undefined") return () => window.removeEventListener("resize", measure);
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    // The fixed rows count too: a header that wraps changes the body, not the content.
    observer.observe(body);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [body, content]);

  return (
    <Drawer
      direction="bottom"
      open={open}
      onOpenChange={(next) => onOpenChange(next)}
      snapPoints={long ? SNAP_POINTS : undefined}
    >
      <DrawerContent
        data-slot="bottom-sheet"
        data-snap={long ? "" : undefined}
        // With stops the sheet is the screen's height (less a strip of the
        // page) and slid down to its stop; without, its content's.
        className={cn(long ? "max-h-[calc(100dvh-1.5rem)] touch-none" : "max-h-[50dvh]", className)}
        {...props}
      >
        <DrawerTitle className="sr-only">{label}</DrawerTitle>
        <div ref={setBody} className="flex min-h-0 flex-1 flex-col">
          {header && (
            <div data-slot="bottom-sheet-header" className="flex h-12 shrink-0 items-center gap-stack-sm pr-2 pl-4">
              {header}
            </div>
          )}
          <DrawerBody>
            <div ref={setContent}>{children}</div>
          </DrawerBody>
          {footer && <div data-slot="bottom-sheet-footer" className="shrink-0">{footer}</div>}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export { BottomSheet };
