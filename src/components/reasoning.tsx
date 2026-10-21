import * as React from "react";
import { useControllableState } from "@radix-ui/react-use-controllable-state";
import { BrainIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";
import { aiDisclosureChevronClass, aiDisclosureTriggerClass } from "./ai-disclosure-variants";
import { ReasoningContext, useReasoning } from "./reasoning-context";
import { Shimmer } from "./shimmer";

/** How long the text stays open after a stream ends before it folds away. */
const AUTO_CLOSE_DELAY_MS = 1000;
const MS_IN_S = 1000;

/**
 * A model's reasoning ("thinking") text, folded under a one-line trigger.
 * Port of the AI Elements `Reasoning` (https://registry.ai-sdk.dev/reasoning.json)
 * on a Radix Collapsible and JLU tokens.
 *
 * While `isStreaming` is true the trigger shimmers „Denke nach …" and the text
 * is open. When a stream ends, the time it took is kept (seconds, rounded
 * up — „Nachgedacht für 4 Sekunden") and the text folds away after one
 * second, unless the user toggled it in that second. A `Reasoning` that is
 * never streamed in its lifetime (a message loaded from history) does not
 * fold by itself: it shows `defaultOpen` and, without a `duration` prop,
 * „Nachgedacht für einige Sekunden".
 *
 * `open`/`defaultOpen`/`onOpenChange` work as on any Radix disclosure. When
 * controlled, the auto-open and auto-close arrive as `onOpenChange` calls.
 */
export interface ReasoningProps extends React.ComponentPropsWithoutRef<typeof Collapsible> {
  /** The reasoning text is still arriving. */
  isStreaming?: boolean;
  /** Seconds the reasoning took, when the app knows it (e.g. stored with the message). Overrides the measured time. */
  duration?: number;
}

const Reasoning = React.forwardRef<HTMLDivElement, ReasoningProps>(
  (
    {
      isStreaming = false,
      open,
      defaultOpen = true,
      onOpenChange,
      duration: durationProp,
      children,
      ...props
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useControllableState({
      prop: open,
      defaultProp: defaultOpen,
      onChange: onOpenChange,
      caller: "Reasoning",
    });
    const [measuredDuration, setMeasuredDuration] = React.useState<number | undefined>(undefined);
    const duration = durationProp ?? measuredDuration;

    // Radix's setter changes identity whenever a controlled `open` changes.
    // Read it through a ref so the stream effect below re-runs only on
    // `isStreaming`: a parent changing `open` inside the one-second window
    // must not cancel the pending close.
    const setIsOpenRef = React.useRef(setIsOpen);
    React.useLayoutEffect(() => {
      setIsOpenRef.current = setIsOpen;
    });
    const streamStartRef = React.useRef<number | null>(null);
    const autoCloseTimerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    React.useEffect(() => {
      if (isStreaming) {
        if (streamStartRef.current === null) {
          streamStartRef.current = Date.now();
          setIsOpenRef.current(true);
        }
        return;
      }
      const start = streamStartRef.current;
      if (start === null) return;
      streamStartRef.current = null;
      setMeasuredDuration(Math.ceil((Date.now() - start) / MS_IN_S));
      const timer = setTimeout(() => setIsOpenRef.current(false), AUTO_CLOSE_DELAY_MS);
      autoCloseTimerRef.current = timer;
      return () => clearTimeout(timer);
    }, [isStreaming]);

    // A toggle by the user wins over the pending auto-close — through the
    // built-in trigger (Radix's onOpenChange) and through `useReasoning()`'s
    // setter alike, so a custom trigger behaves the same.
    const handleOpenChange = (next: boolean) => {
      clearTimeout(autoCloseTimerRef.current);
      setIsOpen(next);
    };

    return (
      <ReasoningContext.Provider
        value={{ isStreaming, isOpen, setIsOpen: handleOpenChange, duration }}
      >
        <Collapsible ref={ref} open={isOpen} onOpenChange={handleOpenChange} {...props}>
          {children}
        </Collapsible>
      </ReasoningContext.Provider>
    );
  },
);
Reasoning.displayName = "Reasoning";

function defaultGetThinkingMessage(isStreaming: boolean, duration?: number): React.ReactNode {
  if (isStreaming) {
    return (
      <Shimmer as="span" duration={1}>
        Denke nach …
      </Shimmer>
    );
  }
  if (duration === undefined) return <span>Nachgedacht für einige Sekunden</span>;
  if (duration < 1) return <span>Nachgedacht für weniger als 1 Sekunde</span>;
  return <span>Nachgedacht für {duration === 1 ? "1 Sekunde" : `${duration} Sekunden`}</span>;
}

/**
 * The button that shows and hides the reasoning: brain icon, status label,
 * chevron. `getThinkingMessage(isStreaming, duration)` replaces the label
 * (defaults are German: „Denke nach …" shimmering while streaming, then
 * „Nachgedacht für N Sekunden" / „… 1 Sekunde" / „… weniger als 1 Sekunde" /
 * „… einige Sekunden" when no duration is known). `children` replace the
 * whole row inside the button. The label is the button's accessible name,
 * so keep it text. No `asChild`: the trigger is always this button — for a
 * trigger element of your own, build it on `useReasoning()`.
 */
export interface ReasoningTriggerProps
  extends Omit<React.ComponentPropsWithoutRef<typeof CollapsibleTrigger>, "asChild"> {
  getThinkingMessage?: (isStreaming: boolean, duration?: number) => React.ReactNode;
}

const ReasoningTrigger = React.forwardRef<HTMLButtonElement, ReasoningTriggerProps>(
  ({ className, children, getThinkingMessage = defaultGetThinkingMessage, ...props }, ref) => {
    const { isStreaming, duration } = useReasoning();
    return (
      <CollapsibleTrigger
        ref={ref}
        className={cn(aiDisclosureTriggerClass, className)}
        {...props}
        asChild={false}
      >
        {children ?? (
          <>
            <BrainIcon aria-hidden="true" className="size-4" />
            {getThinkingMessage(isStreaming, duration)}
            <ChevronDownIcon aria-hidden="true" className={aiDisclosureChevronClass} />
          </>
        )}
      </CollapsibleTrigger>
    );
  },
);
ReasoningTrigger.displayName = "ReasoningTrigger";

/**
 * The reasoning text. Renders its `children` as given — bring your own
 * markdown/math rendering (AI Elements renders a markdown string through
 * `streamdown`; this port does not ship a renderer). Every other prop lands
 * on the element, e.g. `lang="en"` when the model reasons in another
 * language than the UI.
 */
export type ReasoningContentProps = React.ComponentPropsWithoutRef<typeof CollapsibleContent>;

const ReasoningContent = React.forwardRef<HTMLDivElement, ReasoningContentProps>(
  ({ className, ...props }, ref) => (
    <CollapsibleContent
      ref={ref}
      className={cn("mt-4 text-sm text-on-surface-variant outline-none", className)}
      {...props}
    />
  ),
);
ReasoningContent.displayName = "ReasoningContent";

export { Reasoning, ReasoningTrigger, ReasoningContent };
