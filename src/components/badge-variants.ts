import { cva } from "class-variance-authority";

/**
 * The `filled` appearance's tone colours: each status tone on its container
 * token pair. Exported for other status-tinted pills (`ComboboxChip`'s
 * `warning` / `error` tones) so the mapping exists once.
 */
export const badgeFilledTones = {
  neutral: "bg-surface-container-high text-on-surface-variant",
  primary: "bg-primary-container text-on-primary-container",
  secondary: "bg-secondary-container text-on-secondary-container",
  success: "bg-success-container text-on-success-container",
  warning: "bg-warning-container text-on-warning-container",
  error: "bg-error-container text-on-error-container",
  info: "bg-info-container text-on-info-container",
} as const;

/**
 * Badge style variants (cva). Two appearances of the same status vocabulary:
 * `filled` — pill with the tone's *-container background (status labels,
 * KPI deltas); `text` — inline icon+text in the tone color, no background
 * (health checks, meta lines). Tones map 1:1 onto the semantic status tokens.
 */
export const badgeVariants = cva("inline-flex items-center whitespace-nowrap [&_svg]:shrink-0", {
  variants: {
    appearance: {
      filled: "gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
      text: "gap-1 text-sm",
    },
    tone: {
      neutral: "",
      primary: "",
      secondary: "",
      success: "",
      warning: "",
      error: "",
      info: "",
    },
  },
  compoundVariants: [
    { appearance: "filled", tone: "neutral", className: badgeFilledTones.neutral },
    { appearance: "filled", tone: "primary", className: badgeFilledTones.primary },
    { appearance: "filled", tone: "secondary", className: badgeFilledTones.secondary },
    { appearance: "filled", tone: "success", className: badgeFilledTones.success },
    { appearance: "filled", tone: "warning", className: badgeFilledTones.warning },
    { appearance: "filled", tone: "error", className: badgeFilledTones.error },
    { appearance: "filled", tone: "info", className: badgeFilledTones.info },
    { appearance: "text", tone: "neutral", className: "text-on-surface-variant" },
    { appearance: "text", tone: "primary", className: "text-primary" },
    { appearance: "text", tone: "secondary", className: "text-secondary" },
    { appearance: "text", tone: "success", className: "text-success" },
    { appearance: "text", tone: "warning", className: "text-warning" },
    { appearance: "text", tone: "error", className: "text-error" },
    { appearance: "text", tone: "info", className: "text-info" },
  ],
  defaultVariants: {
    appearance: "filled",
    tone: "neutral",
  },
});
