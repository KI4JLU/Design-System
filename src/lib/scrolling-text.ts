/** How fast the text moves, in px per second — a calm reading pace. */
const SPEED = 60;
/** The shortest run, so a text that is a few px too long does not jerk. */
const MIN_DURATION = 0.4;

/**
 * The classes of a line that scrolls to its end while the pointer rests on it.
 * One line, cut with an ellipsis at rest. Under the pointer — its own, or
 * anywhere on the `Card` it is in — or holding the keyboard focus, it waits
 * `--scrolling-text-delay` (600ms) and then moves left at a steady pace until
 * its end is in view, and stays there; it is back at once when the pointer
 * leaves. The move is `text-indent`, so the element needs no wrapper and the
 * ellipsis goes away by itself when the end arrives.
 *
 * The distance and the time come from `measureScrollingText` as
 * `--scrolling-text-overflow` / `--scrolling-text-duration`; without them (a
 * text that fits) nothing moves. Written out in full: Tailwind finds classes
 * by reading the source.
 *
 * The empty `::after` block keeps Safari from showing its own tooltip with the
 * full text over a cut line — the line shows its end itself.
 */
export const scrollingTextClassName =
  "block max-w-full truncate after:block after:content-[''] [transition:text-indent_var(--scrolling-text-return,200ms)_ease-out] " +
  "hover:indent-[calc(-1*var(--scrolling-text-overflow,0px))] hover:[transition:text-indent_var(--scrolling-text-duration,0s)_linear_var(--scrolling-text-delay,600ms)] " +
  "focus-visible:indent-[calc(-1*var(--scrolling-text-overflow,0px))] focus-visible:[transition:text-indent_var(--scrolling-text-duration,0s)_linear_var(--scrolling-text-delay,600ms)] " +
  "group-hover/card:indent-[calc(-1*var(--scrolling-text-overflow,0px))] group-hover/card:[transition:text-indent_var(--scrolling-text-duration,0s)_linear_var(--scrolling-text-delay,600ms)]";

/** Marks a `scrollingTextClassName` line, so the `Card` around it finds it. */
export const scrollingTextAttribute = "data-scrolling-text";

/**
 * Measures how far a line has to move and hands it to the CSS. Called when the
 * pointer arrives (on the line, or on the `Card` around it) or the focus does —
 * the delay before the move leaves the time — so an idle line costs nothing
 * and a renamed or resized one is always right. With reduced motion the line
 * jumps to its end after the delay instead of moving there, and back as fast
 * (`--scrolling-text-return`).
 */
export function measureScrollingText(el: HTMLElement) {
  // Only at rest: a line that is already moved reports a shorter overflow.
  if (parseFloat(getComputedStyle(el).textIndent) !== 0) return;
  const overflow = Math.max(0, el.scrollWidth - el.clientWidth);
  const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  el.style.setProperty("--scrolling-text-overflow", `${overflow}px`);
  el.style.setProperty("--scrolling-text-return", still ? "0s" : "200ms");
  el.style.setProperty("--scrolling-text-duration", still ? "0s" : `${Math.max(overflow / SPEED, MIN_DURATION)}s`);
}

/** Measures every scrolling line inside `root` — a `Card` under the pointer. */
export function measureScrollingTextIn(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>(`[${scrollingTextAttribute}]`).forEach(measureScrollingText);
}
