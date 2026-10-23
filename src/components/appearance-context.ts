import * as React from "react";

/**
 * The two appearance preferences, held by `AppearanceProvider` and mirrored
 * to `<html>`:
 *
 * - **Contrast** (`data-contrast`): `system` follows the OS — increased
 *   contrast (`prefers-contrast: more`) or a forced-colours theme, else
 *   `normal` — `normal` is the design as drawn (content and side panels on
 *   one white, subtle focus: highlight backgrounds), `medium` sets the main
 *   content a hair apart (light `--p-gray-25`, dark `--p-gray-975`; side
 *   panels keep their colour), `more` does that too and strengthens borders and
 *   muted text and forces a visible focus ring on every focusable element
 *   (tokens.css).
 * - **Accent** (`data-accent`): the primary colour family; `standard` is the
 *   JLU blue. Every `primary` token follows it in light and dark.
 */
export type ContrastChoice = "system" | "normal" | "medium" | "more";
export type ResolvedContrast = "normal" | "medium" | "more";

export const ACCENT_COLORS = ["standard", "teal", "violet", "green", "rose", "amber"] as const;
export type AccentColor = (typeof ACCENT_COLORS)[number];

export interface ContrastContextValue {
  contrast: ContrastChoice;
  /** What is applied right now — `system` already resolved. */
  resolvedContrast: ResolvedContrast;
  setContrast: (contrast: ContrastChoice) => void;
}

export interface AccentContextValue {
  accent: AccentColor;
  setAccent: (accent: AccentColor) => void;
}

export const ContrastContext = React.createContext<ContrastContextValue | null>(null);
export const AccentContext = React.createContext<AccentContextValue | null>(null);

/** Outside an AppearanceProvider: follow the system, read-only. */
export function useContrast(): ContrastContextValue {
  return (
    React.useContext(ContrastContext) ?? { contrast: "system", resolvedContrast: "normal", setContrast: () => {} }
  );
}

/** Outside an AppearanceProvider: the standard accent, read-only. */
export function useAccent(): AccentContextValue {
  return React.useContext(AccentContext) ?? { accent: "standard", setAccent: () => {} };
}
