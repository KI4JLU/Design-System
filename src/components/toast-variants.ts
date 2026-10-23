import { cva } from "class-variance-authority";
import { alertToneSurfaces } from "./alert-variants";

/**
 * Status vocabulary of a toast. Mirrors the `tone` set `Badge` already speaks,
 * minus the tones that carry no status meaning (primary/secondary) — a toast
 * always reports *what happened*, never a brand accent.
 */
export type ToastVariant = "neutral" | "success" | "error" | "warning" | "info";

/**
 * Auto-dismiss defaults per variant, in milliseconds.
 *
 * Values are JustRAG's (`web/src/contexts/ToastContext.tsx` → `DEFAULT_DURATIONS`),
 * the only consumer that ships toasts today: an error stays visibly longer than
 * a confirmation because it carries information the user still has to act on,
 * while a success toast only confirms what they just did. `neutral` uses
 * Radix's own default (5000).
 *
 * These are *defaults*, not a limit: `duration` on a single `Toast` overrides
 * them, and `Infinity` disables auto-dismiss entirely (see the `Toast` JSDoc —
 * `duration={0}` does **not**, it falls back to the provider value).
 */
export const TOAST_DURATIONS: Record<ToastVariant, number> = {
  neutral: 5000,
  success: 4000,
  info: 4000,
  warning: 5000,
  error: 6000,
};

/**
 * Toast surface (cva). The same box as `Alert` — the tone's filled container
 * pair from `alertToneSurfaces`, box radius, transparent 1px border (the frame
 * in forced-colours mode) — lifted with `shadow-overlay` because it floats
 * over the page. One look for every message box, inline or floating.
 *
 * Layout is a three-column grid — icon · content · close — with **zero column
 * gap**: the spacing lives on the icon's `mr-3` and the close button's `ml-3`
 * instead. A CSS grid gap is applied between tracks even when a track is
 * empty, so a `gap-x-3` here would indent the text by 12px on every toast that
 * has no icon. Row placement is left to auto-placement (`col-start-2` on
 * title/description/action stacks them), which keeps the parts order-independent
 * at the call site.
 */
export const toastVariants = cva(
  [
    "pointer-events-auto grid grid-cols-[auto_1fr_auto] items-start gap-y-1",
    "rounded-[var(--ui-radius-box)] border border-transparent",
    "px-4 py-3 font-body-base text-sm shadow-overlay",
    // Radix puts tabIndex={0} on the toast (F8 and Tab reach it), so it is a
    // focusable element and owes a visible focus indicator (WCAG 2.4.7).
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
  ],
  {
    variants: {
      variant: alertToneSurfaces,
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

/**
 * Status icon (cva). It takes the tone's text colour, as in `Alert`. The icon
 * is what keeps the variant from being conveyed by color alone (WCAG 1.4.1) —
 * it is decorative for assistive tech (`aria-hidden`) because the *message*
 * already says what happened. `variant` is kept for API compatibility.
 */
export const toastIconVariants = cva("col-start-1 row-start-1 mr-3 h-5 w-5 shrink-0", {
  variants: {
    variant: {
      neutral: "",
      success: "",
      error: "",
      warning: "",
      info: "",
    },
  },
  defaultVariants: {
    variant: "neutral",
  },
});
