import { cva } from "class-variance-authority";

/**
 * Status vocabulary of an alert — the same set `Toast` speaks: what a message
 * reports, never a brand accent (so no primary/secondary like `Badge`).
 */
export type AlertTone = "neutral" | "info" | "success" | "warning" | "error";

/**
 * `box` (default): a rounded block in the page flow, left-aligned.
 *
 * `banner`: app chrome across the full width of the frame for `AppShell`'s
 * `notice` slot — the outage / maintenance message. A **solid** fill in the
 * tone's main colour (the most prominent message the app has), no radius, a
 * slim centred row; title · text · action flow inline and wrap.
 *
 * `pill`: a small floating message for `AppShell`'s `status` slot — reduced
 * operation („Hohe Auslastung"). The tone's container fill with a tinted
 * border and the overlay shadow, as wide as its text; title · text inline.
 */
export type AlertLayout = "box" | "banner" | "pill";

/**
 * Alert surface (cva); `alertToneSurfaces` is shared with `Toast`, so an
 * inline message and a toast in the same tone look the same. Each tone is its `*-container` / `on-*-container` pair
 * (the fills `Badge`'s `filled` appearance uses), so text and icon keep their
 * contrast in both themes; `neutral` takes Badge's neutral fill with full
 * `on-surface` text, since an alert carries sentences, not a two-word label.
 *
 * Box radius (`--ui-radius-box`), like every other multi-line surface.
 *
 * The 1px border is transparent on purpose: invisible normally, it becomes the
 * frame in forced-colours mode, where backgrounds are dropped.
 */
export const alertToneSurfaces: Record<AlertTone, string> = {
  neutral: "bg-surface-container-high text-on-surface",
  info: "bg-info-container text-on-info-container",
  success: "bg-success-container text-on-success-container",
  warning: "bg-warning-container text-on-warning-container",
  error: "bg-error-container text-on-error-container",
};

export const alertVariants = cva(
  "flex gap-3 border border-transparent px-4 font-body-base text-sm",
  {
    variants: {
      tone: alertToneSurfaces,
      layout: {
        box: "w-full items-start rounded-[var(--ui-radius-box)] py-3 text-left",
        // Slim (36–40px for one line), edge to edge, the message centred.
        // The transparent bottom border stays: it is the rule under the
        // banner in forced-colours mode, where the fill is dropped.
        banner:
          "relative w-full items-center justify-center gap-2 rounded-none border-x-0 border-t-0 py-2 text-center",
        pill: "w-fit max-w-full items-center gap-2 rounded-[var(--ui-radius-box)] py-2 text-left shadow-overlay",
      },
    },
    compoundVariants: [
      // Banner: the tone's solid colour instead of its container.
      { layout: "banner", tone: "neutral", class: "bg-inverse-surface text-inverse-on-surface" },
      { layout: "banner", tone: "info", class: "bg-info text-on-info" },
      { layout: "banner", tone: "success", class: "bg-success text-on-success" },
      { layout: "banner", tone: "warning", class: "bg-warning text-on-warning" },
      { layout: "banner", tone: "error", class: "bg-error text-on-error" },
      // Pill: the container fill, framed by a tint of the tone.
      { layout: "pill", tone: "neutral", class: "border-outline-variant" },
      { layout: "pill", tone: "info", class: "border-info/40" },
      { layout: "pill", tone: "success", class: "border-success/40" },
      { layout: "pill", tone: "warning", class: "border-warning/40" },
      { layout: "pill", tone: "error", class: "border-error/40" },
    ],
    defaultVariants: {
      tone: "neutral",
      layout: "box",
    },
  },
);
