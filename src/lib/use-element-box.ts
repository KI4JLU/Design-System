import * as React from "react";

/**
 * The viewport box of `target`, re-measured when the element or the window
 * resizes and when anything scrolls (a scroll moves the box without resizing
 * it). `null` while there is no target (or no element behind it); pass
 * `undefined` while the box is not needed, and it is measured afresh once it
 * is.
 *
 * The first measure runs before paint, so a surface positioned from it never
 * flashes at its fallback geometry. Later ones wait a frame: setting state
 * straight from the observer re-lays out inside the same tick ("ResizeObserver
 * loop completed with undelivered notifications").
 */
export function useElementBox(target: React.RefObject<HTMLElement | null> | undefined): DOMRect | null {
  const [box, setBox] = React.useState<DOMRect | null>(null);
  React.useLayoutEffect(() => {
    const el = target?.current;
    if (!el) return;
    const measure = () => setBox(el.getBoundingClientRect());
    measure();
    let frame = 0;
    const remeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(remeasure);
    ro?.observe(el);
    window.addEventListener("resize", remeasure);
    // Capture: scroll does not bubble, and the scroller may be any ancestor.
    window.addEventListener("scroll", remeasure, { capture: true, passive: true });
    return () => {
      cancelAnimationFrame(frame);
      ro?.disconnect();
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("scroll", remeasure, { capture: true });
    };
  }, [target]);
  return target ? box : null;
}
