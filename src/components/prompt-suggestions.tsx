import * as React from "react";
import { ChevronLeft, ChevronRight, Lightbulb, X } from "lucide-react";
import { cn } from "../lib/utils";
import { useScrollFade } from "../lib/use-scroll-fade";

export interface PromptSuggestionsProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect" | "title"> {
  /** The suggested prompts, shown as given. Blank entries are skipped. */
  suggestions: readonly string[];
  /** Called with the suggestion's text (trimmed). Typically fills the composer. */
  onSelect: (suggestion: string) => void;
  /** Headline above the suggestions ("Vorschläge"); also names the list. */
  title?: React.ReactNode;
  /** Icon before the headline. Default: a lightbulb. `null` hides it. */
  titleIcon?: React.ReactNode;
  /** Disables every suggestion (e.g. no sources to ask about yet). */
  disabled?: boolean;
  /** Leading icon inside each suggestion. */
  icon?: React.ReactNode;
  /**
   * Milliseconds before the component fades in (0 = shown at once). Its space
   * is kept meanwhile, so nothing around it shifts when it appears.
   */
  revealDelay?: number;
  /**
   * Shows a close button in the header. Closing fades the component out but
   * keeps its space, so the layout around it (a centred composer) does not
   * move; `onDismiss` is told afterwards.
   */
  dismissible?: boolean;
  onDismiss?: () => void;
  previousLabel?: string;
  nextLabel?: string;
  dismissLabel?: string;
}

/** Width of the edge fade in px — also the gap an arrow step leaves before a suggestion. */
const FADE = 24;

const controlClass = cn(
  "inline-flex size-8 items-center justify-center text-on-surface-variant transition-colors",
  "rounded-[var(--ui-radius-control,var(--radius-action))]",
  "hover:bg-surface-container-high hover:text-on-surface",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
  "disabled:pointer-events-none disabled:opacity-40 [&>svg]:size-[18px]",
);

/**
 * Starter prompts beneath the composer (PromptInput) of an empty chat: a
 * header (icon, headline, previous/next, optional close) over every
 * suggestion in a single row (scrolling sideways, faded at the edges), each handing its text to `onSelect`. The
 * suggestions are pill chips; the header's buttons use the control radius.
 */
const PromptSuggestions = React.forwardRef<HTMLDivElement, PromptSuggestionsProps>(
  (
    {
      suggestions,
      onSelect,
      title,
      titleIcon,
      disabled,
      icon,
      dismissible,
      onDismiss,
      revealDelay = 0,
      previousLabel = "Previous",
      nextLabel = "Next",
      dismissLabel = "Close",
      className,
      ...props
    },
    ref,
  ) => {
    const titleId = React.useId();
    const items = React.useMemo(
      () => suggestions.map((s) => s.trim()).filter(Boolean),
      [suggestions],
    );
    // One row with every suggestion: what does not fit scrolls sideways and
    // fades out at the edges (the side panels' fade). Previous / next step the
    // row by one suggestion and are offered only while the row overflows.
    const [revealed, setRevealed] = React.useState(revealDelay <= 0);
    const [dismissed, setDismissed] = React.useState(false);
    const shown = revealed && !dismissed;
    React.useEffect(() => {
      if (revealDelay <= 0) return;
      const timer = window.setTimeout(() => setRevealed(true), revealDelay);
      return () => window.clearTimeout(timer);
    }, [revealDelay]);
    const rowRef = React.useRef<HTMLUListElement>(null);
    useScrollFade(rowRef, { axis: "x", size: FADE });
    const [edges, setEdges] = React.useState({ prev: false, next: false });
    React.useLayoutEffect(() => {
      const el = rowRef.current;
      if (!el) return;
      const update = () => {
        const prev = el.scrollLeft > 1;
        const next = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
        setEdges((e) => (e.prev === prev && e.next === next ? e : { prev, next }));
      };
      update();
      el.addEventListener("scroll", update, { passive: true });
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => {
        el.removeEventListener("scroll", update);
        ro.disconnect();
      };
    }, [items.length]);
    const step = (dir: 1 | -1) => {
      const el = rowRef.current;
      if (!el) return;
      const starts = Array.from(el.children, (li) => (li as HTMLElement).offsetLeft);
      const at = el.scrollLeft;
      // Land each suggestion just past the left fade, so the leading one reads in full.
      const stops = starts.map((x) => Math.max(0, x - FADE));
      const target =
        dir === 1 ? stops.find((x) => x > at + 1) : [...stops].reverse().find((x) => x < at - 1);
      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      el.scrollTo({ left: target ?? (dir === 1 ? el.scrollWidth : 0), behavior: reduced ? "auto" : "smooth" });
    };
    if (items.length === 0) return null;
    const scrollable = edges.prev || edges.next;
    const canDismiss = dismissible || !!onDismiss;
    const hasHeader = title != null || scrollable || canDismiss;

    return (
      <div
        ref={ref}
        data-slot="prompt-suggestions"
        data-revealed={shown || undefined}
        aria-hidden={dismissed || undefined}
        className={cn(
          "flex flex-col gap-3 transition-[opacity,visibility] duration-700 ease-out motion-reduce:transition-none",
          shown ? "visible opacity-100" : "invisible opacity-0",
          className,
        )}
        {...props}
      >
        {hasHeader && (
          <div className="flex min-h-8 items-center gap-2">
            {title != null && (
              <>
                {titleIcon !== null && (
                  <span aria-hidden="true" className="flex text-primary [&>svg]:size-[18px]">
                    {titleIcon ?? <Lightbulb />}
                  </span>
                )}
                <h2 id={titleId} className="m-0 text-sm font-medium text-on-surface">
                  {title}
                </h2>
              </>
            )}
            <div className="ml-auto flex items-center gap-1">
              {scrollable && (
                <>
                  <button
                    type="button"
                    className={controlClass}
                    onClick={() => step(-1)}
                    disabled={!edges.prev}
                    aria-label={previousLabel}
                  >
                    <ChevronLeft aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={controlClass}
                    onClick={() => step(1)}
                    disabled={!edges.next}
                    aria-label={nextLabel}
                  >
                    <ChevronRight aria-hidden="true" />
                  </button>
                </>
              )}
              {canDismiss && (
                <button
                  type="button"
                  className={controlClass}
                  onClick={() => {
                    setDismissed(true);
                    onDismiss?.();
                  }}
                  aria-label={dismissLabel}
                >
                  <X aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        )}
        <ul
          ref={rowRef}
          aria-labelledby={title != null ? titleId : undefined}
          className="relative mx-0 -my-1 flex list-none flex-nowrap gap-2 overflow-x-auto px-0 py-1 [&::-webkit-scrollbar]:hidden"
          // Inline, not a utility: an app's unlayered global scrollbar rules would beat it.
          style={{ scrollbarWidth: "none" }}
        >
          {items.map((suggestion, index) => (
            <li key={`${index}-${suggestion}`} className="shrink-0">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(suggestion)}
                className={cn(
                  // A chip: a pill, like the composer above it.
                  "inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-2 text-left text-[13px] text-on-surface-variant transition-colors",
                  "hover:bg-surface-container-low hover:text-on-surface",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  "disabled:pointer-events-none disabled:opacity-40",
                  "[&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-primary",
                )}
              >
                {icon}
                <span>{suggestion}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  },
);
PromptSuggestions.displayName = "PromptSuggestions";

export { PromptSuggestions };
