"use client";

import { createContext, useContext, type MutableRefObject } from "react";

export interface InlineCitationCardContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** True once a click / Enter pinned the card (hover no longer closes it). */
  pinnedRef: MutableRefObject<boolean>;
  /** Set when a pinned card closes: only then does focus return to the chip. */
  restoreFocusRef: MutableRefObject<boolean>;
  hoverOpen: () => void;
  hoverClose: () => void;
  cancel: () => void;
}

export const InlineCitationCardContext =
  createContext<InlineCitationCardContextValue | null>(null);

export const useInlineCitationCard = () => {
  const context = useContext(InlineCitationCardContext);
  if (!context) {
    throw new Error("InlineCitationCard parts must be used within InlineCitationCard");
  }
  return context;
};
