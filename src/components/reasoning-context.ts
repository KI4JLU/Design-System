import * as React from "react";

/** What `useReasoning()` returns inside a `Reasoning`. */
export interface ReasoningContextValue {
  /** The `isStreaming` prop of the enclosing `Reasoning`. */
  isStreaming: boolean;
  /** Whether the reasoning text is shown. */
  isOpen: boolean;
  /**
   * Opens or closes it, as a user toggle: it cancels a pending auto-close
   * (the fold one second after a stream ends), exactly like a click on
   * `ReasoningTrigger`. Calls `onOpenChange` when controlled.
   */
  setIsOpen: (open: boolean) => void;
  /**
   * Seconds the last stream took (rounded up), or the `duration` prop when
   * given. `undefined` until a stream has ended and no prop is set.
   */
  duration: number | undefined;
}

export const ReasoningContext = React.createContext<ReasoningContextValue | null>(null);

/**
 * Reads the state of the enclosing `Reasoning` — for a custom trigger or
 * content. Throws outside a `Reasoning`.
 */
export function useReasoning(): ReasoningContextValue {
  const context = React.useContext(ReasoningContext);
  if (!context) {
    throw new Error("Reasoning components must be used within Reasoning");
  }
  return context;
}
